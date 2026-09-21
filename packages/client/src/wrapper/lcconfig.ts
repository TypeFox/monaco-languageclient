/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import type { ConnectionConfigOptions, ConnectionRetryConfig } from 'monaco-languageclient/common';
import type { DynamicFeature, LanguageClientOptions, StaticFeature } from 'vscode-languageclient/browser';

export interface ConnectionConfig {
  options: ConnectionConfigOptions;
  retryConfig?: ConnectionRetryConfig;
}

export interface LanguageClientConfig {
  languageId: string;
  connection: ConnectionConfig;
  clientOptions: LanguageClientOptions;
  useClientWithProposedFeatures?: boolean;
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  registerFeatures?: Array<StaticFeature | DynamicFeature<any>>;
  logLevel?: LogLevel | number;
}

export interface LanguageClientConfigs {
  configs: Record<string, LanguageClientConfig>;
}
