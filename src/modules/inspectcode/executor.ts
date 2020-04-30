import { spawn } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import { EXTENSION_NAME, INSPECTION_FILENAME, NONZERO_RET_CODE, NO_SLN_WARN } from '../../constants';
import { selectSolutionFile } from '../../utils/workspace';
import { loadDiagnostics } from './diagnostics';
import { Config } from '../config';

export class InspectCodeExecutor {
	constructor(
		private readonly output: vscode.OutputChannel,
		private readonly statusBarItem: vscode.StatusBarItem,
		private readonly diagnosticCollection: vscode.DiagnosticCollection
	) { }

	private showStatusBarItem(): void {
		this.statusBarItem.text = "$(sync~spin) Inspect Code";
		this.statusBarItem.tooltip = "R#: KInspecting code";
		this.statusBarItem.command = `${EXTENSION_NAME}.showoutput`;
		this.statusBarItem.show();
	};

	private hideStatusBarItem(): void {
		this.statusBarItem.text = EXTENSION_NAME;
		this.statusBarItem.tooltip = undefined;
		this.statusBarItem.command = undefined;
		this.statusBarItem.hide();
	}

	private executeInspectCode(filePath: string, xmlPath: string): void {
		this.output.appendLine(`Inspect Code command is running for '${filePath}'...`);

		let args: Array<string> = [];
		let config = Config.getConfig().inspectCodeConfig;
		args.push(
			(config.ConfigPath) ? `--config=${config.ConfigPath}` : "",
			(config.ProfilePath) ? `--profile=${config.ProfilePath}` : "",
			(config.ExcludePaths) ? `--exclude=${config.ExcludePaths.join(';')}` : "",
			(config.IncludePaths) ? `--include=${config.IncludePaths.join(';')}` : "",
			(config.Debug) ? `--debug=True` : "",
			(config.NoSwea) ? `--debug=True` : "",
			(config.Swea) ? `--debug=True` : "",
			(config.Verbosity) ? `--verbosity=${config.Verbosity}` : "",
			(config.Toolset) ? `--toolset=${config.Toolset}` : "",
			(config.Severity) ? `--severity=${config.Severity}` : "",
			(config.Project) ? `--project=${config.Project}` : "",
			(config.ToolsetPath) ? `--toolset-path=${config.ToolsetPath}` : "",
			(config.MonoPath) ? `--mono=${config.MonoPath}` : "",
			(config.DotnetCorePath) ? `--dotnetcore=${config.DotnetCorePath}` : "",
			(config.DotnetCoreSdk) ? `--dotnetcoresdk=${config.DotnetCoreSdk}` : "",
			(config.DisableSettingsLayer) ? `-dsl=${config.DisableSettingsLayer}` : "",
			(config.CachesHomePath) ? `--caches-home=${config.CachesHomePath}` : "",
			(config.TargetForReference) ? `--targets-for-references=${config.TargetForReference}` : "",
			(config.TargetsForItems) ? `--targets-for-items=${config.TargetsForItems}` : "",
			(config.Extensions) ? `-x=${config.Extensions}` : "",
			`--output=${xmlPath}`,
			filePath
		);

		const cp = spawn('inspectcode', args);

		cp.stdin?.addListener('data', message => this.output.append(message.toString()));
		cp.stdout?.addListener('data', message => this.output.append(message.toString()));
		cp.stderr?.addListener('data', message => this.output.append(message.toString()));

		cp.on('exit', code => {
			if (code !== 0) {
				vscode.window.showErrorMessage(NONZERO_RET_CODE);
				this.statusBarItem.hide();
			} else {
				const dirPath = path.dirname(filePath);

				this.diagnosticCollection.clear();
				loadDiagnostics(dirPath, this.diagnosticCollection);

				this.hideStatusBarItem();
				this.output.appendLine('Done.');
			}
		});
	}

	public run(): void {
		selectSolutionFile(filePath => {
			if (!filePath) {
				vscode.window.showWarningMessage(NO_SLN_WARN);
				return;
			}

			const xmlPath = path.join(path.dirname(filePath), INSPECTION_FILENAME);

			this.showStatusBarItem();
			this.executeInspectCode(filePath, xmlPath);
		});
	}
}
