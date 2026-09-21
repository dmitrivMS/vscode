/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SessionConfigKey } from '../../../../platform/agentHost/common/sessionConfigKeys.js';
import { LOCAL_AGENT_HOST_SCHEME_PREFIX } from '../../../../platform/agentHost/common/agentHostConnectionsService.js';
import { parseRemoteAgentHostHarness } from '../../../../platform/agentHost/common/agentHostSessionType.js';
import { getAutomationTelemetryIsolation, getAutomationTelemetryMode, getAutomationTelemetryPermissionLevel, getAutomationTelemetryProvider, type IAutomationConfigurationTelemetry, type IAutomationDefinitionTelemetry, type IAutomationRunTelemetry } from '../../../../platform/telemetry/common/automationTelemetry.js';
import type { IAutomationDescriptor, IAutomationRun } from '../../../../workbench/contrib/chat/common/automations/automation.js';
import { isLocalAgentHostTarget } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';
import { getChatSessionType } from '../../../../workbench/contrib/chat/common/model/chatUri.js';

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
		provider: getBrowserAutomationProvider(run.sessionResource ? getChatSessionType(run.sessionResource) : automation.target.sessionTypeId),
		sessionCreated: run.sessionResource !== undefined,
	};
}

function getBrowserAutomationProvider(sessionType: string | undefined): IAutomationConfigurationTelemetry['provider'] {
	const provider = sessionType && isLocalAgentHostTarget(sessionType)
		? sessionType.slice(LOCAL_AGENT_HOST_SCHEME_PREFIX.length)
		: sessionType ? parseRemoteAgentHostHarness(sessionType) ?? sessionType : undefined;
	return getAutomationTelemetryProvider(provider);
}
