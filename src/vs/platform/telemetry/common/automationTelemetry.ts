/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StringSHA1 } from '../../../base/common/hash.js';
import type { ITelemetryService } from './telemetry.js';
import type { TelemetryTrustedValue } from './telemetryUtils.js';

export type AutomationExecutionAuthority = 'browser' | 'agentHost';
export type AutomationRunOutcome = 'success' | 'error' | 'cancelled' | 'timeout' | 'interrupted';

/** The content-free, saved session configuration; omitted selections retain the provider default. */
export interface IAutomationConfigurationTelemetry {
	readonly copilotSku?: string;
	readonly provider: 'default' | 'other' | 'copilot' | 'copilotcli' | 'claude' | 'codex' | 'copilot-cloud';
	readonly model: string | TelemetryTrustedValue<string> | undefined;
	readonly modelSelectionKind: 'default' | 'auto' | 'explicit';
	readonly mode: 'providerDefault' | 'other' | 'agent' | 'ask' | 'edit' | 'interactive' | 'plan' | 'autopilot';
	readonly permissionLevel: 'providerDefault' | 'other' | 'default' | 'assisted' | 'autoApprove' | 'autopilot';
	readonly isolationMode: 'providerDefault' | 'other' | 'folder' | 'worktree' | 'none';
	readonly targetKind: 'workspace' | 'quickChat';
	readonly folderCount: number;
	readonly hasCustomAgent: boolean;
}

/** Content-free definition and run identity used to correlate Automation lifecycle transitions. */
export interface IAutomationRunTelemetry {
	readonly copilotSku?: string;
	readonly automationId: string;
	readonly runId: string;
	readonly executionAuthority: AutomationExecutionAuthority;
	readonly trigger: 'manual' | 'schedule' | 'catch_up' | 'event';
	readonly runCreatedAt: string;
	readonly provider: IAutomationConfigurationTelemetry['provider'];
	readonly agentSessionId?: string;
	readonly sessionCreated: boolean;
}

type AutomationSkuClassification = {
	copilotSku?: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'The raw Copilot entitlement SKU for the authenticated GitHub account.' };
};

type AutomationConfigurationClassification = AutomationSkuClassification & {
	provider: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Bounded saved provider category, or default/other; session-linked runs report the actual provider.' };
	model: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Trusted catalog model identifier, byokModel or unknown; omitted for the provider default.' };
	modelSelectionKind: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Whether the saved model selection is default, auto or explicit.' };
	mode: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Bounded saved session mode, or providerDefault/other.' };
	permissionLevel: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Bounded saved approval level, or providerDefault/other.' };
	isolationMode: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Saved folder/worktree isolation, none for quick chats, or providerDefault/other.' };
	targetKind: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Whether the automation targets a workspace or a workspace-less quick chat.' };
	folderCount: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; isMeasurement: true; comment: 'Number of saved working directories; no paths are reported.' };
	hasCustomAgent: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; isMeasurement: true; comment: 'Whether a custom agent is selected, without its name or URI.' };
};

type AutomationRunClassification = AutomationSkuClassification & {
	automationId: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'SHA-1 of the complete automation resource URI or opaque browser identifier.' };
	runId: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Native Agent Host run identifier or SHA-1 of the opaque browser run identifier.' };
	executionAuthority: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Whether the browser fallback or Agent Host owns the run lifecycle.' };
	trigger: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Whether the run was manual, scheduled, catch-up or event-triggered.' };
	runCreatedAt: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'UTC timestamp of the durable run claim.' };
	provider: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Bounded Automation session provider.' };
	agentSessionId?: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Native Agent Host session identifier, matching agentHost session telemetry; absent without an Agent Host session.' };
	sessionCreated: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; isMeasurement: true; comment: 'Whether the run has a linked session, including failed or cancelled executions.' };
};

export type IAutomationDefinitionTelemetry = IAutomationConfigurationTelemetry & {
	automationId: string;
	executionAuthority: AutomationExecutionAuthority;
	enabled: boolean;
	scheduleKind: 'manual' | 'scheduled';
};

type AutomationCreatedClassification = AutomationConfigurationClassification & {
	owner: 'ulugbekna';
	comment: 'Records newly persisted automation definitions, excluding migration and replay.';
	automationId: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'SHA-1 of the complete automation resource URI or opaque browser identifier.' };
	executionAuthority: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Whether the browser fallback or Agent Host persisted the new definition.' };
	enabled: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; isMeasurement: true; comment: 'Whether automatic execution is enabled at creation.' };
	scheduleKind: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Whether the definition is manual-only or has automatic triggers.' };
};

type AutomationUpdatedEvent = IAutomationDefinitionTelemetry & {
	enabledChanged: boolean;
	scheduleChanged: boolean;
	sessionConfigurationChanged: boolean;
	promptChanged: boolean;
	titleChanged: boolean;
};
type AutomationUpdatedClassification = Omit<AutomationCreatedClassification, 'comment'> & {
	comment: 'Records persisted, user-editable Automation changes, excluding replay and migration bookkeeping.';
	enabledChanged: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; isMeasurement: true; comment: 'Whether automatic execution was enabled or disabled.' };
	scheduleChanged: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; isMeasurement: true; comment: 'Whether automatic triggers changed, without recording expressions or time zones.' };
	sessionConfigurationChanged: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; isMeasurement: true; comment: 'Whether the saved target or session configuration changed, without recording arbitrary configuration.' };
	promptChanged: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; isMeasurement: true; comment: 'Whether the automation message changed, without recording its content.' };
	titleChanged: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; isMeasurement: true; comment: 'Whether the automation title changed, without recording its content.' };
};
type AutomationDeletedClassification = Omit<AutomationCreatedClassification, 'comment'> & {
	comment: 'Records removal of a persisted Automation; repeated removals do not emit.';
};

type AutomationRunCreatedEvent = IAutomationRunTelemetry & IAutomationConfigurationTelemetry;
type AutomationRunCreatedClassification = AutomationRunClassification & AutomationConfigurationClassification & {
	owner: 'ulugbekna';
	comment: 'Records a new durable Automation run claim, including runs that fail before a session exists. Replays, suppressed overlaps and restored claims do not emit.';
};

type AutomationRunStartedEvent = IAutomationRunTelemetry & IAutomationConfigurationTelemetry;
type AutomationRunStartedClassification = AutomationRunClassification & AutomationConfigurationClassification & {
	owner: 'ulugbekna';
	comment: 'Records the first durable session linkage of a non-terminal Automation run, with its saved configuration.';
};

type AutomationRunCompletedEvent = IAutomationRunTelemetry & {
	outcome: AutomationRunOutcome;
	durationMs: number;
};
type AutomationRunCompletedClassification = AutomationRunClassification & {
	owner: 'ulugbekna';
	comment: 'Records the first persisted terminal transition of an Automation run, including pre-session failures and restart interruptions.';
	outcome: { classification: 'SystemMetaData'; purpose: 'PerformanceAndHealth'; comment: 'Run outcome: success, error, cancelled, timeout or interrupted.' };
	durationMs: { classification: 'SystemMetaData'; purpose: 'PerformanceAndHealth'; isMeasurement: true; comment: 'Wall-clock milliseconds from durable run claim to terminal state.' };
};

export function hashAutomationTelemetryId(id: string): string {
	const sha1 = new StringSHA1();
	sha1.update(id);
	return sha1.digest();
}

export function logAutomationCreated(telemetryService: ITelemetryService, event: IAutomationDefinitionTelemetry): void {
	telemetryService.publicLog2<IAutomationDefinitionTelemetry, AutomationCreatedClassification>('automation.created', {
		...event,
		automationId: hashAutomationTelemetryId(event.automationId),
	});
}

export function logAutomationUpdated(telemetryService: ITelemetryService, event: AutomationUpdatedEvent): void {
	telemetryService.publicLog2<AutomationUpdatedEvent, AutomationUpdatedClassification>('automation.updated', {
		...event,
		automationId: hashAutomationTelemetryId(event.automationId),
	});
}

export function logAutomationDeleted(telemetryService: ITelemetryService, event: IAutomationDefinitionTelemetry): void {
	telemetryService.publicLog2<IAutomationDefinitionTelemetry, AutomationDeletedClassification>('automation.deleted', {
		...event,
		automationId: hashAutomationTelemetryId(event.automationId),
	});
}

export function logAutomationRunCreated(telemetryService: ITelemetryService, event: AutomationRunCreatedEvent): void {
	telemetryService.publicLog2<AutomationRunCreatedEvent, AutomationRunCreatedClassification>('automation.runCreated', {
		...event,
		automationId: hashAutomationTelemetryId(event.automationId),
		runId: event.executionAuthority === 'browser' ? hashAutomationTelemetryId(event.runId) : event.runId,
	});
}

export function logAutomationRunStarted(telemetryService: ITelemetryService, event: AutomationRunStartedEvent): void {
	telemetryService.publicLog2<AutomationRunStartedEvent, AutomationRunStartedClassification>('automation.runStarted', {
		...event,
		automationId: hashAutomationTelemetryId(event.automationId),
		runId: event.executionAuthority === 'browser' ? hashAutomationTelemetryId(event.runId) : event.runId,
	});
}

export function logAutomationRunCompleted(telemetryService: ITelemetryService, event: AutomationRunCompletedEvent): void {
	telemetryService.publicLog2<AutomationRunCompletedEvent, AutomationRunCompletedClassification>('automation.runCompleted', {
		...event,
		automationId: hashAutomationTelemetryId(event.automationId),
		runId: event.executionAuthority === 'browser' ? hashAutomationTelemetryId(event.runId) : event.runId,
		durationMs: Math.max(0, Math.round(event.durationMs)),
	});
}

export function getAutomationTelemetryProvider(provider: string | undefined): IAutomationConfigurationTelemetry['provider'] {
	switch (provider) {
		case undefined:
			return 'default';
		case 'copilot-cli':
		case 'copilotcli':
			return 'copilotcli';
		case 'copilot':
		case 'claude':
		case 'codex':
		case 'copilot-cloud':
			return provider;
		case 'copilot-cloud-agent':
			return 'copilot-cloud';
		case 'openai-codex':
			return 'codex';
		default:
			return 'other';
	}
}

export function getAutomationTelemetryMode(mode: unknown): IAutomationConfigurationTelemetry['mode'] {
	switch (mode) {
		case undefined:
			return 'providerDefault';
		case 'agent':
		case 'ask':
		case 'edit':
		case 'interactive':
		case 'plan':
		case 'autopilot':
			return mode;
		default:
			return 'other';
	}
}

export function getAutomationTelemetryPermissionLevel(permissionLevel: unknown): IAutomationConfigurationTelemetry['permissionLevel'] {
	switch (permissionLevel) {
		case undefined:
			return 'providerDefault';
		case 'default':
		case 'assisted':
		case 'autoApprove':
		case 'autopilot':
			return permissionLevel;
		default:
			return 'other';
	}
}

export function getAutomationTelemetryIsolation(isolation: unknown): IAutomationConfigurationTelemetry['isolationMode'] {
	switch (isolation) {
		case undefined:
		case 'default':
			return 'providerDefault';
		case 'folder':
		case 'worktree':
			return isolation;
		default:
			return 'other';
	}
}
