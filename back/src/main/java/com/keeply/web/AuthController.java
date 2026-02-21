package com.keeply.web;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.util.StringUtils;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.lang.annotation.*;
import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.locks.LockSupport;
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = Objects.requireNonNull(authService);}
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        var response = authService.register(req);
        return ResponseEntity.status(201).body(response);}
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        var response = authService.login(req);
        return ResponseEntity.ok(response);}
    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 8, message = "Senha deve ter ao menos 8 caracteres.") String password,
            @NotBlank @Size(min = 3, message = "Nome completo deve ter ao menos 3 caracteres.") String fullName,
            @Cpf String cpf,
            @BrazilPhone String phoneNumber,
            @Past(message = "Data de nascimento deve ser no passado.") LocalDate birthDate,
            @AssertTrue(message = "É necessário aceitar os termos.") boolean acceptedTerms,
            @AssertTrue(message = "É necessário aceitar a política de privacidade.") boolean acceptedPrivacyPolicy){ }
    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password){}}
final class AuthService {
    private final SupabaseAuthGateway supabaseAuthGateway;
    private final AuthInfoGateway authInfoGateway;
    private final LegalVersions legalVersions;
    AuthService(SupabaseAuthGateway supabaseAuthGateway,
                AuthInfoGateway authInfoGateway,
                LegalVersions legalVersions) {
        this.supabaseAuthGateway = Objects.requireNonNull(supabaseAuthGateway);
        this.authInfoGateway = Objects.requireNonNull(authInfoGateway);
        this.legalVersions = Objects.requireNonNull(legalVersions);}
    public Map<String, Object> register(AuthController.RegisterRequest req) {
        var normalized = normalize(req);
        var signupResponse = supabaseAuthGateway.signup(normalized);
        var userId = SupabaseAuthGateway.extractUserId(signupResponse);
        if (!StringUtils.hasText(userId)) {
            throw new UpstreamException(502, "Não foi possível obter o ID do usuário no Supabase.");}
        var authInfoPayload = buildAuthInfoPayload(userId, normalized);
        try {
            authInfoGateway.upsertAuthInfo(authInfoPayload);
            return Map.copyOf(signupResponse);
        } catch (UpstreamException e) {
            if (isTransientAuthInfoError(e)) {
                var response = new LinkedHashMap<>(signupResponse);
                response.put("auth_info_status", "pending");
                response.put("auth_info_message", "Cadastro criado. Finalização do perfil em processamento.");
                return Map.copyOf(response);}
            throw e;}}
    public Map<String, Object> login(AuthController.LoginRequest req) {
        var email = normalizeEmail(req.email());
        return Map.copyOf(supabaseAuthGateway.login(email, req.password()));}
    private NormalizedRegister normalize(AuthController.RegisterRequest r) {
        var email = normalizeEmail(r.email());
        var fullName = (r.fullName() == null) ? "" : r.fullName().trim();
        var cpfDigits = Digits.onlyDigits(r.cpf());
        var phoneDigits = Digits.onlyDigits(r.phoneNumber());
        return new NormalizedRegister(
                email,
                r.password(),
                fullName,
                cpfDigits,
                phoneDigits,
                r.birthDate(),
                r.acceptedTerms(),
                r.acceptedPrivacyPolicy());}
    private static String normalizeEmail(String email) {
        return (email == null) ? "" : email.trim().toLowerCase(Locale.ROOT);}
    private Map<String, Object> buildAuthInfoPayload(String userId, NormalizedRegister r) {
        var now = Instant.now();
        var payload = new LinkedHashMap<String, Object>();
        payload.put("id", userId);
        payload.put("full_name", r.fullName());
        payload.put("cpf", StringUtils.hasText(r.cpf()) ? r.cpf() : null);
        payload.put("phone_number", StringUtils.hasText(r.phoneNumber()) ? r.phoneNumber() : null);
        payload.put("birth_date", r.birthDate() != null ? r.birthDate().toString() : null);
        payload.put("accepted_terms", r.acceptedTerms());
        payload.put("accepted_terms_at", r.acceptedTerms() ? now.toString() : null);
        payload.put("accepted_terms_version", r.acceptedTerms() ? legalVersions.termsVersion() : null);
        payload.put("accepted_privacy_policy", r.acceptedPrivacyPolicy());
        payload.put("accepted_privacy_policy_at", r.acceptedPrivacyPolicy() ? now.toString() : null);
        payload.put("privacy_policy_version", r.acceptedPrivacyPolicy() ? legalVersions.privacyVersion() : null);
        payload.put("profile_completed", isProfileCompleted(r));
        return Map.copyOf(payload);}
    private static boolean isProfileCompleted(NormalizedRegister r) {
        return StringUtils.hasText(r.fullName())
                && StringUtils.hasText(r.cpf())
                && StringUtils.hasText(r.phoneNumber())
                && r.birthDate() != null;}
    private static boolean isTransientAuthInfoError(UpstreamException e) {
        if (e == null || !StringUtils.hasText(e.getMessage())) return false;
        var m = e.getMessage().toLowerCase(Locale.ROOT);
        return m.contains("ainda não disponível no auth")
                || m.contains("cadastro ainda em processamento")
                || m.contains("auth_info_id_fkey");}
    record NormalizedRegister(
            String email,
            String password,
            String fullName,
            String cpf,
            String phoneNumber,
            LocalDate birthDate,
            boolean acceptedTerms,
            boolean acceptedPrivacyPolicy){}}
final class SupabaseAuthGateway {
    private final RestClient anonClient;
    private final ObjectMapper objectMapper;
    SupabaseAuthGateway(RestClient anonClient, ObjectMapper objectMapper) {
        this.anonClient = Objects.requireNonNull(anonClient);
        this.objectMapper = Objects.requireNonNull(objectMapper);}
    Map<String, Object> signup(AuthService.NormalizedRegister r) {
        try {
            var metadata = new LinkedHashMap<String, Object>();
            metadata.put("full_name", r.fullName());
            metadata.put("cpf", StringUtils.hasText(r.cpf()) ? r.cpf() : null);
            metadata.put("phone_number", StringUtils.hasText(r.phoneNumber()) ? r.phoneNumber() : null);
            metadata.put("birth_date", r.birthDate() != null ? r.birthDate().toString() : null);
            metadata.put("accepted_terms", r.acceptedTerms());
            metadata.put("accepted_terms_version", "v1"); // opcional (auditoria no auth)
            metadata.put("accepted_privacy_policy", r.acceptedPrivacyPolicy());
            metadata.put("privacy_policy_version", "v1"); // opcional (auditoria no auth)
            var payload = new LinkedHashMap<String, Object>();
            payload.put("email", r.email());
            payload.put("password", r.password());
            payload.put("data", metadata);
            @SuppressWarnings("unchecked")
            var response = (Map<String, Object>) anonClient.post()
                    .uri("/auth/v1/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                throw new UpstreamException(502, "Supabase retornou resposta vazia no cadastro.");}
            return response;
        } catch (RestClientResponseException e) {
            var err = parseSupabaseAuthError(e);
            throw new UpstreamException(err.status(), err.message());}}
    Map<String, Object> login(String email, String password) {
        try {
            var payload = Map.of("email", email, "password", password);
            @SuppressWarnings("unchecked")
            var response = (Map<String, Object>) anonClient.post()
                    .uri("/auth/v1/token?grant_type=password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(Map.class);
            if (response == null) {
                throw new UpstreamException(502, "Supabase retornou resposta vazia no login.");}
            return response;
        } catch (RestClientResponseException e) {
            var err = parseSupabaseAuthError(e);
            throw new UpstreamException(err.status(), err.message());}}
    static String extractUserId(Map<String, Object> signupResponse) {
        var userObj = signupResponse.get("user");
        if (userObj instanceof Map<?, ?> userMap) {
            var id = userMap.get("id");
            if (id != null) return String.valueOf(id);}
        var directId = signupResponse.get("id");
        return directId == null ? null : String.valueOf(directId);}
    private ApiError parseSupabaseAuthError(RestClientResponseException e) {
        var status = e.getStatusCode().value();
        var raw = e.getResponseBodyAsString();
        if (!StringUtils.hasText(raw)) {
            return ApiError.of(status, "Erro no Supabase Auth.");}
        try {
            var map = objectMapper.readValue(raw, new TypeReference<Map<String, Object>>() {});
            var msg = firstNonBlank(
                    asString(map.get("msg")),
                    asString(map.get("message")),
                    asString(map.get("error_description")),
                    asString(map.get("error")));
            if (StringUtils.hasText(msg)) {
                var mapped = mapAuthMessage(msg, status);
                return mapped != null ? mapped : ApiError.of(status, msg);}
        } catch (Exception ignored) {}
        var mappedRaw = mapAuthMessage(raw, status);
        return mappedRaw != null ? mappedRaw : ApiError.of(status, raw);}
    private static ApiError mapAuthMessage(String message, int status) {
        if (!StringUtils.hasText(message)) return null;
        var m = message.toLowerCase(Locale.ROOT);
        if (m.contains("user already registered") || (m.contains("email") && m.contains("already"))) {
            return ApiError.of(409, "E-mail já cadastrado.");}
        if (status == 400 && m.contains("invalid login credentials")) {
            return ApiError.of(401, "Credenciais inválidas.");}
        return null;}
    private static String asString(Object v) {
        return v == null ? null : String.valueOf(v);}
    private static String firstNonBlank(String... values) {
        for (var v : values) if (StringUtils.hasText(v)) return v;
        return null;}}
final class AuthInfoGateway {
    private final RestClient adminClient;
    private final ObjectMapper objectMapper;
    AuthInfoGateway(RestClient adminClient, ObjectMapper objectMapper) {
        this.adminClient = Objects.requireNonNull(adminClient);
        this.objectMapper = Objects.requireNonNull(objectMapper);}
    void upsertAuthInfo(Map<String, Object> authInfoPayload) {
        var userId = String.valueOf(authInfoPayload.get("id"));
        waitUntilAuthUserIsVisible(userId);
        final int maxAttempts = 5;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                adminClient.post()
                        .uri("/rest/v1/auth_info?on_conflict=id")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Prefer", "resolution=merge-duplicates,return=minimal")
                        .body(authInfoPayload)
                        .retrieve()
                        .toBodilessEntity();
                return;
            } catch (RestClientResponseException e) {
                var err = parsePostgrestError(e);
                if (isAuthUserForeignKeyViolation(e) && attempt < maxAttempts) {
                    Retry.park(Duration.ofMillis(150L * attempt));
                    continue;}
                throw new UpstreamException(err.status(), err.message());
            } catch (ResourceAccessException e) {
                if (attempt < maxAttempts) {
                    Retry.park(Duration.ofMillis(150L * attempt));
                    continue;}
                throw new UpstreamException(502, "Falha de rede ao persistir auth_info (upstream).");
            } catch (Exception e) {
                throw new UpstreamException(502, "Falha ao persistir auth_info (upstream).");}}}
    private void waitUntilAuthUserIsVisible(String userId) {
        if (!StringUtils.hasText(userId)) return;
        final int maxChecks = 10;
        for (int attempt = 1; attempt <= maxChecks; attempt++) {
            try {
                adminClient.get()
                        .uri("/auth/v1/admin/users/{id}", userId)
                        .retrieve()
                        .toBodilessEntity();
                return;
            } catch (RestClientResponseException e) {
                int status = e.getStatusCode().value();
                if (status == 404 && attempt < maxChecks) {
                    Retry.park(Duration.ofMillis(120L * attempt));
                    continue;}
                if (status == 404) {
                    throw new UpstreamException(502, "Usuário ainda não disponível no Auth. Tente novamente em alguns segundos.");}
                throw e;
            } catch (ResourceAccessException e) {
                if (attempt < maxChecks) {
                    Retry.park(Duration.ofMillis(120L * attempt));
                    continue;}
                throw new UpstreamException(502, "Falha de rede ao confirmar criação do usuário no Auth.");}}}
    private ApiError parsePostgrestError(RestClientResponseException e) {
        var status = e.getStatusCode().value();
        var raw = e.getResponseBodyAsString();
        if (!StringUtils.hasText(raw)) {
            return ApiError.of(status, "Erro ao persistir auth_info.");}
        try {
            var map = objectMapper.readValue(raw, new TypeReference<Map<String, Object>>() {});
            var message = asString(map.get("message"));
            var details = asString(map.get("details"));
            var hint = asString(map.get("hint"));
            var combined = firstNonBlank(message, details, hint, raw);
            var mapped = mapConstraintMessage(combined);
            return mapped != null ? mapped : ApiError.of(status, combined);
        } catch (Exception ignored) {
            var mappedRaw = mapConstraintMessage(raw);
            return mappedRaw != null ? mappedRaw : ApiError.of(status, raw);}}
    private static ApiError mapConstraintMessage(String message) {
        if (!StringUtils.hasText(message)) return null;
        var m = message.toLowerCase(Locale.ROOT);
        if (m.contains("uq_auth_info_cpf")) return ApiError.of(409, "CPF já cadastrado.");
        if (m.contains("uq_auth_info_phone_number")) return ApiError.of(409, "Telefone já cadastrado.");
        if (m.contains("users_email_key")) return ApiError.of(409, "E-mail já cadastrado.");
        if (m.contains("auth_info_id_fkey")) return ApiError.of(409, "Cadastro ainda em processamento. Tente novamente em alguns segundos.");
        if (m.contains("auth_info_cpf_valid") || m.contains("cpf inválido") || m.contains("cpf invalido")) {
            return ApiError.of(400, "CPF inválido.");}
        if (m.contains("auth_info_cpf_format")) {
            return ApiError.of(400, "CPF deve conter 11 dígitos.");}
        if (m.contains("auth_info_phone_format")) {
            return ApiError.of(400, "Telefone inválido. Use de 10 a 15 dígitos.");}
        if (m.contains("auth_info_full_name_minlen")) {
            return ApiError.of(400, "Nome completo deve ter ao menos 3 caracteres.");}
        if (m.contains("auth_info_terms_timestamp_if_true")) {
            return ApiError.of(400, "Termos de uso precisam estar corretamente aceitos.");}
        if (m.contains("auth_info_privacy_timestamp_if_true")) {
            return ApiError.of(400, "Política de privacidade precisa estar corretamente aceita.");}
        if (m.contains("duplicate key value violates unique constraint")) {
            return ApiError.of(409, "Já existe cadastro com um dado único informado.");}
        return null;}
    private static boolean isAuthUserForeignKeyViolation(RestClientResponseException e) {
        var raw = e.getResponseBodyAsString();
        return StringUtils.hasText(raw) && raw.toLowerCase(Locale.ROOT).contains("auth_info_id_fkey");}
    private static String asString(Object v) {
        return v == null ? null : String.valueOf(v);}
    private static String firstNonBlank(String... values) {
        for (var v : values) if (StringUtils.hasText(v)) return v;
        return null;}}
@Configuration
class SupabaseConfig {
    @Bean
    LegalVersions legalVersions(
            @Value("${legal.terms-version:v1}") String termsVersion,
            @Value("${legal.privacy-version:v1}") String privacyVersion
    ) {
        return new LegalVersions(termsVersion, privacyVersion);}
    @Bean
    AuthService authService(SupabaseAuthGateway supabaseAuthGateway,
                            AuthInfoGateway authInfoGateway,
                            LegalVersions legalVersions) {
        return new AuthService(supabaseAuthGateway, authInfoGateway, legalVersions);}
    @Bean
    SupabaseAuthGateway supabaseAuthGateway(@Qualifier("supabaseAnonClient") RestClient anonClient,
                                           ObjectMapper objectMapper) {
        return new SupabaseAuthGateway(anonClient, objectMapper);}
    @Bean
    AuthInfoGateway authInfoGateway(@Qualifier("supabaseAdminClient") RestClient adminClient,
                                    ObjectMapper objectMapper) {
        return new AuthInfoGateway(adminClient, objectMapper);}
    @Bean("supabaseAnonClient")
    RestClient supabaseAnonClient(
            RestClient.Builder builder,
            @Value("${supabase.url:}") String supabaseUrl,
            @Value("${supabase.anon-key:}") String anonKey){
        require(supabaseUrl, "Config ausente: supabase.url");
        require(anonKey, "Config ausente: supabase.anon-key");
        return builder
                .requestFactory(jdkFactory(Duration.ofSeconds(5), Duration.ofSeconds(10)))
                .baseUrl(supabaseUrl)
                .defaultHeader("apikey", anonKey)
                .defaultHeader("Authorization", "Bearer " + anonKey)
                .build();}
    @Bean("supabaseAdminClient")
    RestClient supabaseAdminClient(
            RestClient.Builder builder,
            @Value("${supabase.url:}") String supabaseUrl,
            @Value("${supabase.service-role-key:}") String serviceRoleKey){
        require(supabaseUrl, "Config ausente: supabase.url");
        require(serviceRoleKey, "Config ausente: supabase.service-role-key");
        return builder
                .requestFactory(jdkFactory(Duration.ofSeconds(5), Duration.ofSeconds(10)))
                .baseUrl(supabaseUrl)
                .defaultHeader("apikey", serviceRoleKey)
                .defaultHeader("Authorization", "Bearer " + serviceRoleKey)
                .build();}
    private static ClientHttpRequestFactory jdkFactory(Duration connectTimeout, Duration readTimeout) {
        var httpClient = HttpClient.newBuilder()
                .connectTimeout(connectTimeout)
                .build();
        var f = new JdkClientHttpRequestFactory(httpClient);
        f.setReadTimeout(readTimeout);
        return f;}
    private static void require(String value, String message) {
        if (!StringUtils.hasText(value)) throw new IllegalStateException(message);}}
record LegalVersions(String termsVersion, String privacyVersion) { }
@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
        var fieldErrors = new LinkedHashMap<String, String>();
        for (FieldError fe : e.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage());}
        var payload = Map.<String, Object>of(
                "error", true,
                "status", 400,
                "message", "Dados inválidos.",
                "fields", Map.copyOf(fieldErrors)
        );
        return ResponseEntity.badRequest().body(payload);}
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> handleNotReadable(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(ApiError.of(400, "JSON inválido ou campos em formato incorreto."));}
    @ExceptionHandler(UpstreamException.class)
    ResponseEntity<ApiError> handleUpstream(UpstreamException e) {
        return ResponseEntity.status(e.status()).body(ApiError.of(e.status(), e.getMessage()));}
    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(ApiError.of(400, e.getMessage()));}
    @ExceptionHandler(RestClientResponseException.class)
    ResponseEntity<ApiError> handleUnwrappedRestClient(RestClientResponseException e) {
        var status = e.getStatusCode().value();
        return ResponseEntity.status(status).body(ApiError.of(status, "Falha em serviço externo."));}
    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleGeneric(Exception e) {
        return ResponseEntity.internalServerError().body(ApiError.of(500, "Erro interno."));}}
record ApiError(boolean error, int status, String message) {
    static ApiError of(int status, String message) {
        return new ApiError(true, status, message);}}
final class UpstreamException extends RuntimeException {
    private final int status;
    UpstreamException(int status, String message) {
        super(message);
        this.status = status;}
    int status() {
        return status;}}
final class Retry {
    private Retry() {}
    @FunctionalInterface
    interface ThrowingSupplier<T> {
        T get() throws Exception;
    }
    static <T> T withBackoff(int maxAttempts, Duration initialDelay, ThrowingSupplier<T> action) throws Exception {
        var delay = initialDelay;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return action.get();
            } catch (RestClientResponseException e) {
                if (!isRetryableStatus(e) || attempt == maxAttempts) throw e;
                park(delayWithJitter(delay));
                delay = cap(delay.multipliedBy(2), Duration.ofSeconds(2));
            } catch (ResourceAccessException e) {
                if (attempt == maxAttempts) throw e;
                park(delayWithJitter(delay));
                delay = cap(delay.multipliedBy(2), Duration.ofSeconds(2)); }}
        throw new IllegalStateException("Retry falhou de forma inesperada.");}
    private static boolean isRetryableStatus(RestClientResponseException e) {
        int s = e.getStatusCode().value();
        return s == 429 || (s >= 500 && s <= 599);}
    private static Duration delayWithJitter(Duration base) {
        long jitterMs = ThreadLocalRandom.current().nextLong(0, 60);
        return base.plusMillis(jitterMs);}
    private static Duration cap(Duration d, Duration max) {
        return d.compareTo(max) > 0 ? max : d;}
    static void park(Duration d) {
        if (Thread.currentThread().isInterrupted()) {
            throw new RuntimeException("Retry interrompido.");}
        LockSupport.parkNanos(d.toNanos());
        if (Thread.currentThread().isInterrupted()) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Retry interrompido.");}}}
final class Digits {
    private Digits() {}
    static String onlyDigits(String value) {
        if (!StringUtils.hasText(value)) return "";
        var s = value.trim();
        var sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c >= '0' && c <= '9') sb.append(c);}
        return sb.toString();}}
@Documented
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = CpfValidator.class)
@interface Cpf {
    String message() default "CPF inválido.";
    Class<?>[] groups() default {};
    Class<? extends jakarta.validation.Payload>[] payload() default {};}
final class CpfValidator implements ConstraintValidator<Cpf, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        var cpf = Digits.onlyDigits(value);
        if (!StringUtils.hasText(cpf)) return true; // opcional
        if (cpf.length() != 11) return false;
        if (cpf.chars().distinct().count() == 1) return false;
        int s1 = 0, s2 = 0;
        for (int i = 0; i < 9; i++) {
            int n = cpf.charAt(i) - '0';
            s1 += n * (10 - i);s2 += n * (11 - i);}
        int d1 = 11 - (s1 % 11);
        d1 = (d1 >= 10) ? 0 : d1;
        s2 += d1 * 2;
        int d2 = 11 - (s2 % 11);
        d2 = (d2 >= 10) ? 0 : d2;
        return d1 == (cpf.charAt(9) - '0') && d2 == (cpf.charAt(10) - '0');}}
@Documented
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = BrazilPhoneValidator.class)
@interface BrazilPhone {
    String message() default "Telefone inválido. Use de 10 a 15 dígitos.";
    Class<?>[] groups() default {};
    Class<? extends jakarta.validation.Payload>[] payload() default {};}
final class BrazilPhoneValidator implements ConstraintValidator<BrazilPhone, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        var digits = Digits.onlyDigits(value);
        if (!StringUtils.hasText(digits)) return true;
        return digits.length() >= 10 && digits.length() <= 15;}}
