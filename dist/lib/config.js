import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
let _activeConfig = undefined;
export class Config {
    constructor(configDir, opts) {
        this.configDir = configDir;
        this.values = {};
        this.error = undefined;
        this.read();
        this.overrides = opts;
    }
    static setActiveConfig(cfg) {
        _activeConfig = cfg;
    }
    static getActiveConfig() {
        return _activeConfig;
    }
    get filePath() {
        return path.join(this.configDir, 'config.json');
    }
    packageInstallPath(id) {
        return path.join(this.configDir, 'packages', id);
    }
    appLogPath(id) {
        return path.join(this.configDir, 'logs', `${id}.log`);
    }
    schemaInstallPath(domain) {
        return path.join(this.configDir, 'schemas', domain);
    }
    get domain() {
        return this.overrides.domain || this.values.domain || undefined;
    }
    get port() {
        return this.overrides.port || this.values.port || 3000;
    }
    get debugMode() {
        return this.overrides.debugMode || this.values.debugMode || false;
    }
    get simulateHyperspace() {
        return this.overrides.simulateHyperspace || this.values.simulateHyperspace || undefined;
    }
    get hyperspaceHost() {
        return this.overrides.hyperspaceHost || this.values.hyperspaceHost || undefined;
    }
    get hyperspaceStorage() {
        return this.overrides.hyperspaceStorage || this.values.hyperspaceStorage || path.join(os.homedir(), '.hyperspace/storage');
    }
    read() {
        this.error = undefined;
        try {
            this.values = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        }
        catch (e) {
            this.error = e;
        }
    }
    update(values) {
        Object.assign(this.values, values);
        this.write();
    }
    write() {
        try {
            fs.mkdirSync(this.configDir);
        }
        catch (e) { }
        fs.writeFileSync(this.filePath, JSON.stringify(this.values, null, 2), 'utf8');
    }
}
