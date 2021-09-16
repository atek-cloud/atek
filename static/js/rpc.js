// node_modules/jsonrpc-lite/dist/esnext/jsonrpc.js
"use strict";
var hasOwnProperty = Object.prototype.hasOwnProperty;
var isInteger = typeof Number.isSafeInteger === "function" ? Number.isSafeInteger : function(num) {
  return typeof num === "number" && isFinite(num) && num === Math.floor(num) && Math.abs(num) <= 9007199254740991;
};
var JsonRpc = class {
  constructor() {
    this.jsonrpc = "2.0";
  }
  serialize() {
    return JSON.stringify(this);
  }
};
JsonRpc.VERSION = "2.0";
var RequestObject = class extends JsonRpc {
  constructor(id, method, params) {
    super();
    this.id = id;
    this.method = method;
    if (params !== void 0) {
      this.params = params;
    }
  }
};
var NotificationObject = class extends JsonRpc {
  constructor(method, params) {
    super();
    this.method = method;
    if (params !== void 0) {
      this.params = params;
    }
  }
};
var SuccessObject = class extends JsonRpc {
  constructor(id, result) {
    super();
    this.id = id;
    this.result = result;
  }
};
var ErrorObject = class extends JsonRpc {
  constructor(id, error) {
    super();
    this.id = id;
    this.error = error;
    this.id = id;
    this.error = error;
  }
};
var JsonRpcParsed = class {
  constructor(payload, type) {
    this.payload = payload;
    this.type = type;
    this.payload = payload;
    this.type = type;
  }
};
var JsonRpcError = class {
  constructor(message, code, data) {
    this.message = message;
    this.code = isInteger(code) ? code : 0;
    if (data != null) {
      this.data = data;
    }
  }
};
JsonRpcError.invalidRequest = function(data) {
  return new JsonRpcError("Invalid request", -32600, data);
};
JsonRpcError.methodNotFound = function(data) {
  return new JsonRpcError("Method not found", -32601, data);
};
JsonRpcError.invalidParams = function(data) {
  return new JsonRpcError("Invalid params", -32602, data);
};
JsonRpcError.internalError = function(data) {
  return new JsonRpcError("Internal error", -32603, data);
};
JsonRpcError.parseError = function(data) {
  return new JsonRpcError("Parse error", -32700, data);
};
function request(id, method, params) {
  const object = new RequestObject(id, method, params);
  validateMessage(object, true);
  return object;
}
function parseObject(obj) {
  let err = null;
  let payload = null;
  let payloadType = "invalid";
  if (obj == null || obj.jsonrpc !== JsonRpc.VERSION) {
    err = JsonRpcError.invalidRequest(obj);
    payloadType = "invalid";
  } else if (!hasOwnProperty.call(obj, "id")) {
    const tmp = obj;
    payload = new NotificationObject(tmp.method, tmp.params);
    err = validateMessage(payload);
    payloadType = "notification";
  } else if (hasOwnProperty.call(obj, "method")) {
    const tmp = obj;
    payload = new RequestObject(tmp.id, tmp.method, tmp.params);
    err = validateMessage(payload);
    payloadType = "request";
  } else if (hasOwnProperty.call(obj, "result")) {
    const tmp = obj;
    payload = new SuccessObject(tmp.id, tmp.result);
    err = validateMessage(payload);
    payloadType = "success";
  } else if (hasOwnProperty.call(obj, "error")) {
    const tmp = obj;
    payloadType = "error";
    if (tmp.error == null) {
      err = JsonRpcError.internalError(tmp);
    } else {
      const errorObj = new JsonRpcError(tmp.error.message, tmp.error.code, tmp.error.data);
      if (errorObj.message !== tmp.error.message || errorObj.code !== tmp.error.code) {
        err = JsonRpcError.internalError(tmp);
      } else {
        payload = new ErrorObject(tmp.id, errorObj);
        err = validateMessage(payload);
      }
    }
  }
  if (err == null && payload != null) {
    return new JsonRpcParsed(payload, payloadType);
  }
  return new JsonRpcParsed(err != null ? err : JsonRpcError.invalidRequest(obj), "invalid");
}
function validateMessage(obj, throwIt) {
  let err = null;
  if (obj instanceof RequestObject) {
    err = checkId(obj.id);
    if (err == null) {
      err = checkMethod(obj.method);
    }
    if (err == null) {
      err = checkParams(obj.params);
    }
  } else if (obj instanceof NotificationObject) {
    err = checkMethod(obj.method);
    if (err == null) {
      err = checkParams(obj.params);
    }
  } else if (obj instanceof SuccessObject) {
    err = checkId(obj.id);
    if (err == null) {
      err = checkResult(obj.result);
    }
  } else if (obj instanceof ErrorObject) {
    err = checkId(obj.id, true);
    if (err == null) {
      err = checkError(obj.error);
    }
  }
  if (throwIt && err != null) {
    throw err;
  }
  return err;
}
function checkId(id, maybeNull) {
  if (maybeNull && id === null) {
    return null;
  }
  return isString(id) || isInteger(id) ? null : JsonRpcError.internalError('"id" must be provided, a string or an integer.');
}
function checkMethod(method) {
  return isString(method) ? null : JsonRpcError.invalidRequest(method);
}
function checkResult(result) {
  return result === void 0 ? JsonRpcError.internalError("Result must exist for success Response objects") : null;
}
function checkParams(params) {
  if (params === void 0) {
    return null;
  }
  if (Array.isArray(params) || isObject(params)) {
    try {
      JSON.stringify(params);
      return null;
    } catch (err) {
      return JsonRpcError.parseError(params);
    }
  }
  return JsonRpcError.invalidParams(params);
}
function checkError(err) {
  if (!(err instanceof JsonRpcError)) {
    return JsonRpcError.internalError("Error must be an instance of JsonRpcError");
  }
  if (!isInteger(err.code)) {
    return JsonRpcError.internalError("Invalid error code. It must be an integer.");
  }
  if (!isString(err.message)) {
    return JsonRpcError.internalError("Message must exist or must be a string.");
  }
  return null;
}
function isString(obj) {
  return obj !== "" && typeof obj === "string";
}
function isObject(obj) {
  return obj != null && typeof obj === "object" && !Array.isArray(obj);
}

// index.js
var _id = 1;
var RpcClient = class {
  constructor(url) {
    this.$url = url;
  }
  $setEndpoint(url) {
    this.$url = url;
  }
  async $rpc(methodName, params) {
    const responseBody = await (await fetch(this.$url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request(_id++, methodName, removeUndefinedsAtEndOfArray(params)))
    })).json();
    const parsed = parseObject(responseBody);
    if (parsed.type === "error") {
      const err = new Error(parsed.payload.error.message);
      err.code = parsed.payload.error.code;
      throw err;
    } else if (parsed.type === "success") {
      return parsed.payload.result;
    }
  }
};
var rpcProxyHandler = {
  get(client, name) {
    if (name in client) {
      return client[name];
    } else {
      return (...params) => client.$rpc(name, params);
    }
  }
};
function create(url) {
  const client = url instanceof RpcClient ? url : new RpcClient(url);
  return new Proxy(client, rpcProxyHandler);
}
function removeUndefinedsAtEndOfArray(arr) {
  let len = arr.length;
  for (let i = len - 1; i >= 0; i--) {
    if (typeof arr[i] === "undefined")
      len--;
    else
      break;
  }
  return arr.slice(0, len);
}
export {
  RpcClient,
  create
};
