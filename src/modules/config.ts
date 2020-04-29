import { CCCliOptions } from "./cleancode/models";
import * as vscode from "vscode";
import { EXTENSION_NAME } from "../constants";

export class Config {
    static conf: Config;
    cleanupCodeConfig: CCCliOptions;
    private constructor() {
        this.cleanupCodeConfig = {};
    }
    static getConfig() {
        if (Config.conf === undefined) {
            Config.conf = new Config();
        }
        return Config.conf;
    }
    loadConfig() {
        let config = vscode.workspace.getConfiguration(EXTENSION_NAME);
        this.cleanupCodeConfig = config.get<CCCliOptions>("cleanupcode", this.cleanupCodeConfig);
    }
}