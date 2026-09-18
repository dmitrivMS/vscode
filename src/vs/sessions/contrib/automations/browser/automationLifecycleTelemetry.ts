/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SessionConfigKey } from '../../../../platform/agentHost/common/sessionConfigKeys.js';
import { getAutomationTelemetryIsolation, getAutomationTelemetryMode, getAutomationTelemetryPermissionLevel, getAutomationTelemetryProvider, type IAutomationConfigurationTelemetry, type IAutomationDefinitionTelemetry, type IAutomationRunTelemetry } from '../../../../platform/telemetry/common/automationTelemetry.js';
import type { IAutomationDescriptor, IAutomationRun } from '../../../../workbench/contrib/chat/common/automations/automation.js';

export function getBrowserAutomationConfigurationTelemetry(automation: IAutomationDescriptor): IAutomationConfigurationTelemetry {
	const template = automation.sessionTemplate;
	const modelId = template?.modelId ?? automation.modelId;
	return {
		provider: getAutomationTelemetryProvider(automation.target.sessionTypeId),
		model: undefined,
		modelSelectionKind: modelId === undefined ? 'default' : modelId === 'auto' ? 'auto' : 'explicit',
		mode: getAutomationTelemetryMode(template ? template.config?.[SessionConfigKey.Mode] : automation.mode),
		permissionLevel: getAutomationTelemetryPermissionLevel(template ? template.config?.[SessionConfigKey.AutoApprove] : automation.permissionLevel),
		isolationMode: automation.target.kind === 'workspace' ? getAutomationTelemetryIsolation(automation.target.isolation.kind) : 'none',
		targetKind: automation.target.kind,
		folderCount: automation.target.kind === 'workspace' ? 1 : 0,
		hasCustomAgent: template?.agent !== undefined,
	};
}

export function getBrowserAutomationDefinitionTelemetry(automation: IAutomationDescriptor): IAutomationDefinitionTelemetry {
	return {
		...getBrowserAutomationConfigurationTelemetry(automation),
		automationId: automation.id,
		executionAuthority: 'browser',
		enabled: automation.enabled,
		scheduleKind: automation.schedule.interval === 'manual' ? 'manual' : 'scheduled',
	};
}

export function getBrowserAutomationRunTelemetry(run: IAutomationRun, automation: IAutomationDescriptor): IAutomationRunTelemetry {
	return {
		automationId: run.automationId,
		runId: run.id,
		executionAuthority: 'browser',
		trigger: run.trigger,
		runCreatedAt: run.startedAt,
		provider: getBrowserAutomationConfigurationTelemetry(automation).provider,
		sessionCreated: run.sessionResource !== undefined,
	};
}
