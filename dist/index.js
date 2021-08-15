import { RateLimiter } from 'pauls-sliding-window-rate-limiter';
import * as http from 'http';
import createExpressApp, * as express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Config } from './lib/config.js';
// import * as db from './db/index.js'
// import * as apps from './apps/index.js'
// import * as accountsHttpAPI from './httpapi/accounts.js'
// import * as appsHttpAPI from './httpapi/apps.js'
// import * as cloudHttpAPI from './httpapi/cloud.js'
// import * as debugHttpAPI from './httpapi/debug.js'
// import * as hyperHttpAPI from './httpapi/hyper.js'
// import * as profilesHttpAPI from './httpapi/profiles.js'
// import * as uwgHttpAPI from './httpapi/uwg.js'
import * as sessionMiddleware from './httpapi/session-middleware.js';
// import * as perf from './lib/perf.js'
// import * as metrics from './lib/metrics.js'
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as os from 'os';
import { Liquid } from 'liquidjs';
// import { resolve } from 'import-meta-resolve'
const INSTALL_PATH = path.dirname(fileURLToPath(import.meta.url));
const INSTALL_UI_PATH = path.join(INSTALL_PATH, '..', 'frontend', 'ui');
const INSTALL_JSON_FORMS_PATH = path.join(INSTALL_PATH, '..', 'frontend', 'json-forms');
let app;
let _serverReadyCb;
export const whenServerReady = new Promise(r => { _serverReadyCb = r; });
export async function start(opts) {
    const configDir = opts.configDir || path.join(os.homedir(), '.atx');
    let config = new Config(configDir, opts);
    Config.setActiveConfig(config);
    // if (config.benchmarkMode) {
    //   perf.enable()
    // }
    // metrics.setup({configDir: opts.configDir})
    if (config.debugMode)
        console.log('Debug mode enabled');
    // await db.setup(config)
    // await apps.setup(config)
    const server = createServer(config);
    process.on('SIGINT', close);
    process.on('SIGTERM', close);
    async function close() {
        console.log('Shutting down, this may take a moment...');
        // apps.stopAll()
        // await db.cleanup()
        server.close();
        process.exit(0);
    }
    _serverReadyCb(undefined);
    return {
        server,
        // db,
        close: async () => {
            console.log('Shutting down, this may take a moment...');
            // apps.stopAll()
            // await db.cleanup()
            server.close();
        }
    };
}
function createServer(config) {
    app = createExpressApp();
    app.engine('liquid', (new Liquid()).express());
    app.set('views', path.join(INSTALL_UI_PATH, 'views'));
    app.set('view engine', 'liquid');
    app.set('trust proxy', 'loopback');
    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());
    app.use(sessionMiddleware.setup());
    const rl = new RateLimiter({
        limit: 10000,
        window: 60e3
    });
    app.use((req, res, next) => {
        res.header('Cross-Origin-Opener-Policy', 'same-origin');
        res.header('Cross-Origin-Embedder-Policy', 'require-corp');
        // metrics.httpRequest({path: req.url})
        if (!rl.hit(req.ip)) {
            return res.status(429).json({
                error: 'RateLimitError',
                message: 'Rate limit exceeded'
            });
        }
        next();
    });
    // accountsHttpAPI.setup(app, config)
    // appsHttpAPI.setup(app, config)
    // cloudHttpAPI.setup(app, config)
    // hyperHttpAPI.setup(app, config)
    // profilesHttpAPI.setup(app, config)
    // uwgHttpAPI.setup(app, config)
    // if (config.debugMode) debugHttpAPI.setup(app)
    app.use('/_api', (req, res) => json404(res, 'Not found'));
    app.get('/', (req, res) => res.render('index'));
    app.get('/index', (req, res) => res.render('index'));
    app.get('/index.html', (req, res) => res.render('index'));
    app.get('/p/*', (req, res) => res.render('index'));
    app.get('/p/*/*', (req, res) => res.render('index'));
    app.use('/img', express.static(path.join(INSTALL_UI_PATH, 'static', 'img')));
    app.use('/css', express.static(path.join(INSTALL_UI_PATH, 'static', 'css')));
    app.get('/js/app.build.js', (req, res) => {
        if (process.env.NODE_ENV === 'production') {
            res.sendFile(path.join(INSTALL_UI_PATH, 'static', 'js', 'app.build.js'));
        }
        else {
            res.sendFile(path.join(INSTALL_UI_PATH, 'static', 'js', 'app.js'));
        }
    });
    app.use('/js', express.static(path.join(INSTALL_UI_PATH, 'static', 'js')));
    app.use('/vendor', express.static(path.join(INSTALL_UI_PATH, 'static', 'vendor')));
    app.use('/webfonts', express.static(path.join(INSTALL_UI_PATH, 'static', 'webfonts')));
    app.use('/ui/json-forms', express.static(INSTALL_JSON_FORMS_PATH));
    app.use('/_schemas', express.static('schemas'));
    app.get('/manifest.json', (req, res) => res.sendFile(path.join(INSTALL_UI_PATH, 'static', 'manifest.json')));
    app.get(new RegExp('/([^/])'), (req, res) => res.render('index'));
    app.use((req, res) => {
        res.status(404).send('404 Page not found');
    });
    const server = new http.Server(app);
    server.listen(config.port, () => {
        console.log(`Application server listening at http://localhost:${config.port}`);
    });
    return server;
}
function json404(res, e) {
    res.status(404).json({ error: true, message: e instanceof Error && e.message ? e.message : e.toString() });
}
