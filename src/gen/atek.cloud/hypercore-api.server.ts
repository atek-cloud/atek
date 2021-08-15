import { ApiBrokerServer, ApiBrokerServerHandlers } from '@atek-cloud/api-broker';
// Generated file
export default class HypercoreAPIServer extends ApiBrokerServer {
    constructor(handlers: ApiBrokerServerHandlers) {
        super({
            "id": "atek.cloud/hypercore-api",
            "type": "api",
            "title": "Hypercore API",
            "todo": [
                "Protocol extensions",
                "Read/write streams"
            ],
            "wrappers": {
                "hypercore": {
                    "param": {
                        "name": "key",
                        "type": "string"
                    },
                    "methods": [
                        "describe",
                        "append",
                        "get",
                        "cancel",
                        "has",
                        "download",
                        "undownload",
                        "downloaded",
                        "update",
                        "seek",
                        "configureNetwork",
                        "subscribe"
                    ]
                }
            },
            "definition": {
                "methods": {
                    "create": {
                        "description": "Create a new hypercore.",
                        "response": {
                            "type": "object",
                            "properties": {
                                "key": {
                                    "type": "string",
                                    "contentEncoding": "base64"
                                },
                                "discoveryKey": {
                                    "type": "string",
                                    "contentEncoding": "base64"
                                },
                                "writable": {
                                    "type": "boolean"
                                },
                                "length": {
                                    "type": "number"
                                },
                                "byteLength": {
                                    "type": "number"
                                }
                            }
                        }
                    },
                    "describe": {
                        "description": "Return information about a hypercore.",
                        "params": [
                            {
                                "name": "key",
                                "type": "string",
                                "contentEncoding": "base64"
                            }
                        ],
                        "response": {
                            "type": "object",
                            "properties": {
                                "key": {
                                    "type": "string",
                                    "contentEncoding": "base64"
                                },
                                "discoveryKey": {
                                    "type": "string",
                                    "contentEncoding": "base64"
                                },
                                "writable": {
                                    "type": "boolean"
                                },
                                "length": {
                                    "type": "number"
                                },
                                "byteLength": {
                                    "type": "number"
                                }
                            }
                        }
                    },
                    "append": {
                        "description": "Append a block or array of blocks to the hypercore.",
                        "params": [
                            {
                                "name": "key",
                                "type": "string",
                                "contentEncoding": "base64"
                            },
                            {
                                "name": "data",
                                "oneOf": [
                                    {
                                        "type": "string",
                                        "contentEncoding": "base64"
                                    },
                                    {
                                        "type": "array",
                                        "items": {
                                            "type": "string",
                                            "contentEncoding": "base64"
                                        }
                                    }
                                ]
                            }
                        ],
                        "response": {
                            "description": "The index number of the new block.",
                            "type": "number"
                        }
                    },
                    "get": {
                        "description": "Get a block of data from the feed.",
                        "params": [
                            {
                                "name": "key",
                                "type": "string",
                                "contentEncoding": "base64"
                            },
                            {
                                "name": "index",
                                "type": "number"
                            },
                            {
                                "name": "options",
                                "type": "object",
                                "properties": {
                                    "ifAvailable": {
                                        "type": "boolean"
                                    },
                                    "wait": {
                                        "type": "boolean"
                                    },
                                    "callId": {
                                        "type": "string",
                                        "description": "A UUID used to describe this call, to be passed into cancel(). Must be unique."
                                    }
                                }
                            }
                        ],
                        "response": {
                            "type": "string",
                            "contentEncoding": "base64"
                        }
                    },
                    "cancel": {
                        "description": "Cancel a `get()` operation.",
                        "params": [
                            {
                                "name": "key",
                                "type": "string",
                                "contentEncoding": "base64"
                            },
                            {
                                "name": "getCallId",
                                "type": "string",
                                "description": "The `callId` passed as an option to `get()`."
                            }
                        ]
                    },
                    "has": {
                        "description": "Check if the feed has a specific block.",
                        "params": [
                            {
                                "name": "key",
                                "type": "string",
                                "contentEncoding": "base64"
                            },
                            {
                                "name": "index",
                                "type": "number"
                            }
                        ],
                        "response": {
                            "type": "boolean"
                        }
                    },
                    "download": {
                        "description": "Select a range to be downloaded.",
                        "params": [
                            {
                                "name": "key",
                                "type": "string",
                                "contentEncoding": "base64"
                            },
                            {
                                "name": "start",
                                "type": "number"
                            },
                            {
                                "name": "end",
                                "type": "number"
                            },
                            {
                                "name": "options",
                                "type": "object",
                                "properties": {
                                    "callId": {
                                        "type": "string",
                                        "description": "A UUID used to describe this call, to be passed into undownload(). Must be unique."
                                    }
                                }
                            }
                        ]
                    },
                    "undownload": {
                        "description": "Cancel a `download()` operation.",
                        "params": [
                            {
                                "name": "key",
                                "type": "string",
                                "contentEncoding": "base64"
                            },
                            {
                                "name": "downloadCallId",
                                "type": "string",
                                "description": "The `callId` passed as an option to `download()`."
                            }
                        ]
                    },
                    "downloaded": {
                        "description": "Returns total number of downloaded blocks within range. If `end` is not specified it will default to the total number of blocks. If `start` is not specified it will default to 0.",
                        "params": [
                            {
                                "name": "key",
                                "type": "string",
                                "contentEncoding": "base64"
                            },
                            {
                                "name": "start",
                                "type": "number"
                            },
                            {
                                "name": "end",
                                "type": "number"
                            }
                        ],
                        "response": {
                            "type": "number"
                        }
                    },
                    "update": {
                        "description": "Fetch an update for the feed.",
                        "params": [
                            {
                                "name": "key",
                                "type": "string",
                                "contentEncoding": "base64"
                            },
                            {
                                "name": "opts",
                                "type": "object",
                                "properties": {
                                    "minLength": {
                                        "type": "number"
                                    },
                                    "ifAvailable": {
                                        "type": "boolean"
                                    },
                                    "hash": {
                                        "type": "boolean"
                                    }
                                }
                            }
                        ]
                    },
                    "seek": {
                        "description": "Seek to a byte offset. Responds with `index` and `relativeOffset`, where index is the data block the byteOffset is contained in and relativeOffset is the relative byte offset in the data block.",
                        "params": [
                            {
                                "name": "key",
                                "type": "string",
                                "contentEncoding": "base64"
                            },
                            {
                                "name": "byteOffset",
                                "type": "number"
                            }
                        ],
                        "response": {
                            "type": "object",
                            "properties": {
                                "index": {
                                    "type": "number"
                                },
                                "relativeOffset": {
                                    "type": "number"
                                }
                            }
                        }
                    },
                    "configureNetwork": {
                        "description": "Configure the networking behavior for a specific hypercore.",
                        "params": [
                            {
                                "name": "key",
                                "type": "string",
                                "contentEncoding": "base64"
                            },
                            {
                                "name": "opts",
                                "type": "object",
                                "properties": {
                                    "lookup": {
                                        "type": "boolean",
                                        "description": "Should we find peers?"
                                    },
                                    "announce": {
                                        "type": "boolean",
                                        "description": "Should we announce ourself as a peer?"
                                    },
                                    "flush": {
                                        "type": "boolean",
                                        "description": "Wait for the full swarm flush before returning?"
                                    },
                                    "remember": {
                                        "type": "boolean",
                                        "description": "Persist this configuration?"
                                    }
                                }
                            }
                        ]
                    }
                },
                "emitters": {
                    "subscribeNetwork": {
                        "description": "Subscribe to all network events.",
                        "events": {
                            "peer-add": {
                                "id": {
                                    "type": "number"
                                },
                                "peer": {
                                    "type": "object",
                                    "properties": {
                                        "remotePublicKey": {
                                            "type": "string",
                                            "contentEncoding": "base64"
                                        },
                                        "remoteAddress": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        }
                                    }
                                }
                            },
                            "peer-remove": {
                                "id": {
                                    "type": "number"
                                },
                                "peer": {
                                    "type": "object",
                                    "properties": {
                                        "remotePublicKey": {
                                            "type": "string",
                                            "contentEncoding": "base64"
                                        },
                                        "remoteAddress": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "subscribe": {
                        "description": "Subscribe to a hypercore's events.",
                        "params": [
                            {
                                "name": "key",
                                "type": "string",
                                "contentEncoding": "base64"
                            }
                        ],
                        "events": {
                            "append": {
                                "key": {
                                    "type": "string",
                                    "contentEncoding": "base64"
                                },
                                "length": {
                                    "type": "number"
                                },
                                "byteLength": {
                                    "type": "number"
                                }
                            },
                            "close": {
                                "key": {
                                    "type": "string",
                                    "contentEncoding": "base64"
                                }
                            },
                            "peer-add": {
                                "key": {
                                    "type": "string",
                                    "contentEncoding": "base64"
                                },
                                "id": {
                                    "type": "number"
                                },
                                "peer": {
                                    "type": "object",
                                    "properties": {
                                        "remotePublicKey": {
                                            "type": "string",
                                            "contentEncoding": "base64"
                                        },
                                        "remoteAddress": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        }
                                    }
                                }
                            },
                            "peer-remove": {
                                "key": {
                                    "type": "string",
                                    "contentEncoding": "base64"
                                },
                                "id": {
                                    "type": "number"
                                },
                                "peer": {
                                    "type": "object",
                                    "properties": {
                                        "remotePublicKey": {
                                            "type": "string",
                                            "contentEncoding": "base64"
                                        },
                                        "remoteAddress": {
                                            "type": "string"
                                        },
                                        "type": {
                                            "type": "string"
                                        }
                                    }
                                }
                            },
                            "wait": {
                                "key": {
                                    "type": "string",
                                    "contentEncoding": "base64"
                                }
                            },
                            "download": {
                                "key": {
                                    "type": "string",
                                    "contentEncoding": "base64"
                                },
                                "seq": {
                                    "type": "number"
                                },
                                "byteLength": {
                                    "type": "number"
                                }
                            },
                            "upload": {
                                "key": {
                                    "type": "string",
                                    "contentEncoding": "base64"
                                },
                                "seq": {
                                    "type": "number"
                                },
                                "byteLength": {
                                    "type": "number"
                                }
                            }
                        }
                    }
                }
            }
        }, handlers);
    }
}
