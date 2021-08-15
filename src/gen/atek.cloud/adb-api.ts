import { ApiBrokerClient } from '@atek-cloud/api-broker';
// Generated file
class AustinDataBaseAPIClient extends ApiBrokerClient {
    constructor() {
        super({
            "id": "atek.cloud/adb-api",
            "type": "api",
            "title": "Austin DataBase API",
            "definition": {
                "methods": {
                    "describe": {
                        "description": "Get metadata and information about a database.",
                        "params": {
                            "type": "array",
                            "minLength": 1,
                            "items": [
                                {
                                    "name": "dbId",
                                    "type": "string"
                                }
                            ]
                        },
                        "response": {
                            "type": "object",
                            "required": [
                                "dbId",
                                "dbType",
                                "tables"
                            ],
                            "properties": {
                                "dbId": {
                                    "type": "string"
                                },
                                "dbType": {
                                    "type": "string",
                                    "enum": [
                                        "hyperbee"
                                    ]
                                },
                                "displayName": {
                                    "type": "string"
                                },
                                "tables": {
                                    "type": "array",
                                    "items": {
                                        "$id": "https://atek.cloud/apdl-adb-record-schema.json",
                                        "title": "APDL ADB Record Schema",
                                        "description": "Schema for Atek Protocol Description Language ADB Record documents.",
                                        "type": "object",
                                        "required": [
                                            "id",
                                            "type"
                                        ],
                                        "properties": {
                                            "id": {
                                                "type": "string"
                                            },
                                            "type": {
                                                "type": "string",
                                                "enum": [
                                                    "adb-record"
                                                ]
                                            },
                                            "definition": {
                                                "type": "object"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "list": {
                        "description": "List records in a table.",
                        "params": {
                            "type": "array",
                            "minLength": 2,
                            "items": [
                                {
                                    "name": "dbId",
                                    "type": "string"
                                },
                                {
                                    "name": "tableId",
                                    "type": "string"
                                }
                            ]
                        },
                        "response": {
                            "type": "object",
                            "required": [
                                "records"
                            ],
                            "properties": {
                                "records": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "required": [
                                            "key",
                                            "path",
                                            "url",
                                            "seq",
                                            "value"
                                        ],
                                        "properties": {
                                            "key": {
                                                "type": "string"
                                            },
                                            "path": {
                                                "type": "string"
                                            },
                                            "url": {
                                                "type": "string"
                                            },
                                            "seq": {
                                                "type": "number"
                                            },
                                            "value": {
                                                "type": "object"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "get": {
                        "description": "Get a record in a table.",
                        "params": {
                            "type": "array",
                            "minLength": 3,
                            "items": [
                                {
                                    "name": "dbId",
                                    "type": "string"
                                },
                                {
                                    "name": "tableId",
                                    "type": "string"
                                },
                                {
                                    "name": "key",
                                    "type": "string"
                                }
                            ]
                        },
                        "response": {
                            "type": "object",
                            "required": [
                                "key",
                                "path",
                                "url",
                                "seq",
                                "value"
                            ],
                            "properties": {
                                "key": {
                                    "type": "string"
                                },
                                "path": {
                                    "type": "string"
                                },
                                "url": {
                                    "type": "string"
                                },
                                "seq": {
                                    "type": "number"
                                },
                                "value": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "create": {
                        "description": "Add a record to a table.",
                        "params": {
                            "type": "array",
                            "minLength": 3,
                            "items": [
                                {
                                    "name": "dbId",
                                    "type": "string"
                                },
                                {
                                    "name": "tableId",
                                    "type": "string"
                                },
                                {
                                    "name": "value",
                                    "type": "object"
                                },
                                {
                                    "name": "blobs",
                                    "type": "object",
                                    "patternProperties": {
                                        ".*": {
                                            "type": "object",
                                            "required": [
                                                "buf"
                                            ],
                                            "properties": {
                                                "mimeType": {
                                                    "type": "string"
                                                },
                                                "buf": {
                                                    "type": "string",
                                                    "contentEncoding": "base64"
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        },
                        "response": {
                            "type": "object",
                            "required": [
                                "key",
                                "path",
                                "url",
                                "seq",
                                "value"
                            ],
                            "properties": {
                                "key": {
                                    "type": "string"
                                },
                                "path": {
                                    "type": "string"
                                },
                                "url": {
                                    "type": "string"
                                },
                                "seq": {
                                    "type": "number"
                                },
                                "value": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "put": {
                        "description": "Write a record to a table.",
                        "params": {
                            "type": "array",
                            "minLength": 4,
                            "items": [
                                {
                                    "name": "dbId",
                                    "type": "string"
                                },
                                {
                                    "name": "tableId",
                                    "type": "string"
                                },
                                {
                                    "name": "key",
                                    "type": "string"
                                },
                                {
                                    "name": "value",
                                    "type": "object"
                                }
                            ]
                        },
                        "response": {
                            "type": "object",
                            "required": [
                                "key",
                                "path",
                                "url",
                                "seq",
                                "value"
                            ],
                            "properties": {
                                "key": {
                                    "type": "string"
                                },
                                "path": {
                                    "type": "string"
                                },
                                "url": {
                                    "type": "string"
                                },
                                "seq": {
                                    "type": "number"
                                },
                                "value": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "delete": {
                        "description": "Delete a record from a table.",
                        "params": {
                            "type": "array",
                            "minLength": 3,
                            "items": [
                                {
                                    "name": "dbId",
                                    "type": "string"
                                },
                                {
                                    "name": "tableId",
                                    "type": "string"
                                },
                                {
                                    "name": "key",
                                    "type": "string"
                                }
                            ]
                        }
                    },
                    "diff": {
                        "description": "Enumerate the differences between two versions of the database.",
                        "params": {
                            "type": "array",
                            "minLength": 2,
                            "items": [
                                {
                                    "name": "dbId",
                                    "type": "string"
                                },
                                {
                                    "name": "opts",
                                    "type": "object",
                                    "required": [
                                        "left"
                                    ],
                                    "properties": {
                                        "left": {
                                            "type": "number"
                                        },
                                        "right": {
                                            "type": "number"
                                        },
                                        "tableIds": {
                                            "type": "array",
                                            "items": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                }
                            ]
                        },
                        "response": {
                            "diff": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "required": [
                                        "left",
                                        "right"
                                    ],
                                    "properties": {
                                        "left": {
                                            "type": "object",
                                            "required": [
                                                "key",
                                                "path",
                                                "url",
                                                "seq",
                                                "value"
                                            ],
                                            "properties": {
                                                "key": {
                                                    "type": "string"
                                                },
                                                "path": {
                                                    "type": "string"
                                                },
                                                "url": {
                                                    "type": "string"
                                                },
                                                "seq": {
                                                    "type": "number"
                                                },
                                                "value": {
                                                    "type": "object"
                                                }
                                            }
                                        },
                                        "right": {
                                            "type": "object",
                                            "required": [
                                                "key",
                                                "path",
                                                "url",
                                                "seq",
                                                "value"
                                            ],
                                            "properties": {
                                                "key": {
                                                    "type": "string"
                                                },
                                                "path": {
                                                    "type": "string"
                                                },
                                                "url": {
                                                    "type": "string"
                                                },
                                                "seq": {
                                                    "type": "number"
                                                },
                                                "value": {
                                                    "type": "object"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "getBlob": {
                        "description": "Get a blob of a record.",
                        "params": {
                            "type": "array",
                            "minLength": 4,
                            "items": [
                                {
                                    "name": "dbId",
                                    "type": "string"
                                },
                                {
                                    "name": "tableId",
                                    "type": "string"
                                },
                                {
                                    "name": "key",
                                    "type": "string"
                                },
                                {
                                    "name": "blobName",
                                    "type": "string"
                                }
                            ]
                        },
                        "response": {
                            "type": "object",
                            "required": [
                                "start",
                                "end",
                                "mimeType",
                                "buf"
                            ],
                            "properties": {
                                "start": {
                                    "type": "number"
                                },
                                "end": {
                                    "type": "number"
                                },
                                "mimeType": {
                                    "type": "string"
                                },
                                "buf": {
                                    "type": "string",
                                    "contentEncoding": "base64"
                                }
                            }
                        }
                    },
                    "putBlob": {
                        "description": "Write a blob of a record.",
                        "params": {
                            "type": "array",
                            "minLength": 5,
                            "items": [
                                {
                                    "name": "dbId",
                                    "type": "string"
                                },
                                {
                                    "name": "tableId",
                                    "type": "string"
                                },
                                {
                                    "name": "key",
                                    "type": "string"
                                },
                                {
                                    "name": "blobName",
                                    "type": "string"
                                },
                                {
                                    "name": "value",
                                    "type": "object",
                                    "required": [
                                        "buf"
                                    ],
                                    "properties": {
                                        "mimeType": {
                                            "type": "string"
                                        },
                                        "buf": {
                                            "type": "string",
                                            "contentEncoding": "base64"
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    "delBlob": {
                        "description": "Delete a blob of a record.",
                        "params": {
                            "type": "array",
                            "minLength": 4,
                            "items": [
                                {
                                    "name": "dbId",
                                    "type": "string"
                                },
                                {
                                    "name": "tableId",
                                    "type": "string"
                                },
                                {
                                    "name": "key",
                                    "type": "string"
                                },
                                {
                                    "name": "blobName",
                                    "type": "string"
                                }
                            ]
                        }
                    }
                },
                "emitters": {
                    "subscribe": {
                        "description": "Listen for changes to a database.",
                        "params": {
                            "type": "array",
                            "minLength": 1,
                            "items": [
                                {
                                    "name": "dbId",
                                    "type": "string"
                                },
                                {
                                    "name": "opts",
                                    "type": "object",
                                    "properties": {
                                        "tableIds": {
                                            "type": "array",
                                            "items": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                }
                            ]
                        },
                        "events": {
                            "change": {
                                "type": "object",
                                "required": [
                                    "left",
                                    "right"
                                ],
                                "properties": {
                                    "left": {
                                        "type": "object",
                                        "required": [
                                            "key",
                                            "path",
                                            "url",
                                            "seq",
                                            "value"
                                        ],
                                        "properties": {
                                            "key": {
                                                "type": "string"
                                            },
                                            "path": {
                                                "type": "string"
                                            },
                                            "url": {
                                                "type": "string"
                                            },
                                            "seq": {
                                                "type": "number"
                                            },
                                            "value": {
                                                "type": "object"
                                            }
                                        }
                                    },
                                    "right": {
                                        "type": "object",
                                        "required": [
                                            "key",
                                            "path",
                                            "url",
                                            "seq",
                                            "value"
                                        ],
                                        "properties": {
                                            "key": {
                                                "type": "string"
                                            },
                                            "path": {
                                                "type": "string"
                                            },
                                            "url": {
                                                "type": "string"
                                            },
                                            "seq": {
                                                "type": "number"
                                            },
                                            "value": {
                                                "type": "object"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    async describe(dbId: string): Promise<Describe_Response> {
        return this._rpc("describe", [dbId]);
    }
    async list(dbId: string, tableId: string): Promise<List_Response> {
        return this._rpc("list", [dbId, tableId]);
    }
    async get(dbId: string, tableId: string, key: string): Promise<Get_Response> {
        return this._rpc("get", [dbId, tableId, key]);
    }
    async create(dbId: string, tableId: string, value: CreateValue, blobs: CreateBlobs): Promise<Create_Response> {
        return this._rpc("create", [dbId, tableId, value, blobs]);
    }
    async put(dbId: string, tableId: string, key: string, value: PutValue): Promise<Put_Response> {
        return this._rpc("put", [dbId, tableId, key, value]);
    }
    async delete(dbId: string, tableId: string, key: string): Promise<undefined> {
        return this._rpc("delete", [dbId, tableId, key]);
    }
    async diff(dbId: string, opts: DiffOpts): Promise<undefined> {
        return this._rpc("diff", [dbId, opts]);
    }
    async getBlob(dbId: string, tableId: string, key: string, blobName: string): Promise<GetBlob_Response> {
        return this._rpc("getBlob", [dbId, tableId, key, blobName]);
    }
    async putBlob(dbId: string, tableId: string, key: string, blobName: string, value: PutBlobValue): Promise<undefined> {
        return this._rpc("putBlob", [dbId, tableId, key, blobName, value]);
    }
    async delBlob(dbId: string, tableId: string, key: string, blobName: string): Promise<undefined> {
        return this._rpc("delBlob", [dbId, tableId, key, blobName]);
    }
}
export type Describe_Response = {
    dbId: string;
    dbType: ("hyperbee" & string);
    displayName?: string;
    tables: ({
        id: string;
        type: ("adb-record" & string);
        definition?: {
            [property: string]: any;
        };
    })[];
};
export type List_Response = {
    records: ({
        key: string;
        path: string;
        url: string;
        seq: number;
        value: {
            [property: string]: any;
        };
    })[];
};
export type Get_Response = {
    key: string;
    path: string;
    url: string;
    seq: number;
    value: {
        [property: string]: any;
    };
};
export type Create_Response = {
    key: string;
    path: string;
    url: string;
    seq: number;
    value: {
        [property: string]: any;
    };
};
export type CreateValue = {
    [property: string]: any;
};
export type CreateBlobs = {
    [patternProperties: string]: {
        mimeType?: string;
        buf: string;
    };
};
export type Put_Response = {
    key: string;
    path: string;
    url: string;
    seq: number;
    value: {
        [property: string]: any;
    };
};
export type PutValue = {
    [property: string]: any;
};
export type DiffOpts = {
    left: number;
    right?: number;
    tableIds?: (string)[];
};
export type GetBlob_Response = {
    start: number;
    end: number;
    mimeType: string;
    buf: string;
};
export type PutBlobValue = {
    mimeType?: string;
    buf: string;
};
const client: AustinDataBaseAPIClient = new AustinDataBaseAPIClient();
export default client;
