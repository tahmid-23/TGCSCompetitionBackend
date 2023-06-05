export interface SqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

export interface BackendConfig {
  port: number;
  secret: string;
  googleClientId: string;
}

export interface Config {
  sql: SqlConfig;
  smtp: SmtpConfig;
  backend: BackendConfig;
}
