import { v4 as uuidv4 } from 'uuid';
class Session {
    constructor(req, res, auth) {
        this.req = req;
        this.res = res;
        this.auth = auth;
    }
    isAuthed() {
        return Boolean(this.auth && (this.auth.sessionId || this.auth.appId));
    }
    isAppAuthed() {
        return Boolean(this.auth && this.auth.appId);
    }
    isAccountAuthed() {
        return Boolean(this.auth && this.auth.accountId);
    }
    async create({ accountId }) {
        const sess = {
            sessionId: uuidv4(),
            accountId,
            createdAt: (new Date()).toISOString()
        };
        // await privateServerDb.accountSessions.put(sess.sessionId, sess) TODO
        this.auth = {
            sessionId: sess.sessionId,
            accountId
        };
        this.res.cookie('session', sess.sessionId, {
            httpOnly: true,
            sameSite: 'strict'
        });
    }
    async destroy() {
        if (this.req.cookies.session) {
            // await privateServerDb.accountSessions.del(this.req.cookies.session) TODO
            this.res.clearCookie('session');
            this.auth = undefined;
        }
    }
}
export function setup() {
    return async (req, res, next) => {
        let auth = undefined;
        if (req.cookies.session) {
            // TODO
            // const sessionRecord = await privateServerDb.accountSessions.get(req.cookies.session).catch(e => undefined)
            // if (sessionRecord) {
            //   auth = {
            //     sessionId: sessionRecord.value.sessionId,
            //     username: sessionRecord.value.username
            //   }
            // }
        }
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            // TODO
            // const app = apps.getByBearerToken(req.headers.authorization.split(' ')[1])
            // if (app) {
            //   auth = {
            //     appId: app.id
            //   }
            // }
        }
        req.session = new Session(req, res, auth);
        next();
    };
}
