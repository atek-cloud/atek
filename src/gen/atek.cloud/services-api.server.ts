import { ApiBrokerServer, ApiBrokerServerHandlers } from '@atek-cloud/api-broker';
// Generated file
export default class ServicesControlAndManagementAPIServer extends ApiBrokerServer {
    constructor(handlers: ApiBrokerServerHandlers) {
        super({
            "id": "atek.cloud/services-api",
            "type": "api",
            "title": "Services Control and Management API",
            "definition": {
                "methods": {
                    "list": {
                        "description": "List all installed services.",
                        "response": {
                            "type": "object",
                            "properties": {
                                "services": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "status": {
                                                "type": "string",
                                                "enum": [
                                                    "inactive",
                                                    "active"
                                                ]
                                            },
                                            "settings": {
                                                "type": "object",
                                                "required": [
                                                    "id",
                                                    "port",
                                                    "sourceUrl",
                                                    "package",
                                                    "system",
                                                    "installedBy"
                                                ],
                                                "properties": {
                                                    "id": {
                                                        "type": "string",
                                                        "pattern": "^([a-zA-Z][a-zA-Z0-9-]{1,62}[a-zA-Z0-9])$"
                                                    },
                                                    "port": {
                                                        "type": "number"
                                                    },
                                                    "sourceUrl": {
                                                        "type": "string",
                                                        "format": "uri"
                                                    },
                                                    "desiredVersion": {
                                                        "type": "string"
                                                    },
                                                    "package": {
                                                        "type": "object",
                                                        "required": [
                                                            "sourceType"
                                                        ],
                                                        "properties": {
                                                            "sourceType": {
                                                                "type": "string",
                                                                "enum": [
                                                                    "file",
                                                                    "git"
                                                                ]
                                                            },
                                                            "installedVersion": {
                                                                "type": "string"
                                                            },
                                                            "title": {
                                                                "type": "string"
                                                            }
                                                        }
                                                    },
                                                    "manifest": {
                                                        "type": "object",
                                                        "properties": {
                                                            "name": {
                                                                "type": "string"
                                                            },
                                                            "description": {
                                                                "type": "string"
                                                            },
                                                            "author": {
                                                                "type": "string"
                                                            },
                                                            "license": {
                                                                "type": "string"
                                                            }
                                                        }
                                                    },
                                                    "system": {
                                                        "type": "object",
                                                        "required": [
                                                            "appPort"
                                                        ],
                                                        "properties": {
                                                            "appPort": {
                                                                "type": "number"
                                                            }
                                                        }
                                                    },
                                                    "installedBy": {
                                                        "type": "string",
                                                        "pattern": "^([a-zA-Z][a-zA-Z0-9-]{1,62}[a-zA-Z0-9])$"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "get": {
                        "description": "Fetch information about an installed service.",
                        "params": [
                            {
                                "name": "id",
                                "type": "string"
                            }
                        ],
                        "response": {
                            "type": "object",
                            "properties": {
                                "status": {
                                    "type": "string",
                                    "enum": [
                                        "inactive",
                                        "active"
                                    ]
                                },
                                "settings": {
                                    "type": "object",
                                    "required": [
                                        "id",
                                        "port",
                                        "sourceUrl",
                                        "package",
                                        "system",
                                        "installedBy"
                                    ],
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "pattern": "^([a-zA-Z][a-zA-Z0-9-]{1,62}[a-zA-Z0-9])$"
                                        },
                                        "port": {
                                            "type": "number"
                                        },
                                        "sourceUrl": {
                                            "type": "string",
                                            "format": "uri"
                                        },
                                        "desiredVersion": {
                                            "type": "string"
                                        },
                                        "package": {
                                            "type": "object",
                                            "required": [
                                                "sourceType"
                                            ],
                                            "properties": {
                                                "sourceType": {
                                                    "type": "string",
                                                    "enum": [
                                                        "file",
                                                        "git"
                                                    ]
                                                },
                                                "installedVersion": {
                                                    "type": "string"
                                                },
                                                "title": {
                                                    "type": "string"
                                                }
                                            }
                                        },
                                        "manifest": {
                                            "type": "object",
                                            "properties": {
                                                "name": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "author": {
                                                    "type": "string"
                                                },
                                                "license": {
                                                    "type": "string"
                                                }
                                            }
                                        },
                                        "system": {
                                            "type": "object",
                                            "required": [
                                                "appPort"
                                            ],
                                            "properties": {
                                                "appPort": {
                                                    "type": "number"
                                                }
                                            }
                                        },
                                        "installedBy": {
                                            "type": "string",
                                            "pattern": "^([a-zA-Z][a-zA-Z0-9-]{1,62}[a-zA-Z0-9])$"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "install": {
                        "description": "Install a new service.",
                        "params": [
                            {
                                "name": "opts",
                                "type": "object",
                                "required": [
                                    "sourceUrl"
                                ],
                                "properties": {
                                    "sourceUrl": {
                                        "type": "string",
                                        "format": "uri"
                                    },
                                    "desiredVersion": {
                                        "type": "string"
                                    },
                                    "port": {
                                        "type": "number"
                                    }
                                }
                            }
                        ],
                        "response": {
                            "type": "object",
                            "properties": {
                                "status": {
                                    "type": "string",
                                    "enum": [
                                        "inactive",
                                        "active"
                                    ]
                                },
                                "settings": {
                                    "type": "object",
                                    "required": [
                                        "id",
                                        "port",
                                        "sourceUrl",
                                        "package",
                                        "system",
                                        "installedBy"
                                    ],
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "pattern": "^([a-zA-Z][a-zA-Z0-9-]{1,62}[a-zA-Z0-9])$"
                                        },
                                        "port": {
                                            "type": "number"
                                        },
                                        "sourceUrl": {
                                            "type": "string",
                                            "format": "uri"
                                        },
                                        "desiredVersion": {
                                            "type": "string"
                                        },
                                        "package": {
                                            "type": "object",
                                            "required": [
                                                "sourceType"
                                            ],
                                            "properties": {
                                                "sourceType": {
                                                    "type": "string",
                                                    "enum": [
                                                        "file",
                                                        "git"
                                                    ]
                                                },
                                                "installedVersion": {
                                                    "type": "string"
                                                },
                                                "title": {
                                                    "type": "string"
                                                }
                                            }
                                        },
                                        "manifest": {
                                            "type": "object",
                                            "properties": {
                                                "name": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "author": {
                                                    "type": "string"
                                                },
                                                "license": {
                                                    "type": "string"
                                                }
                                            }
                                        },
                                        "system": {
                                            "type": "object",
                                            "required": [
                                                "appPort"
                                            ],
                                            "properties": {
                                                "appPort": {
                                                    "type": "number"
                                                }
                                            }
                                        },
                                        "installedBy": {
                                            "type": "string",
                                            "pattern": "^([a-zA-Z][a-zA-Z0-9-]{1,62}[a-zA-Z0-9])$"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "uninstall": {
                        "description": "Uninstall a service.",
                        "params": [
                            {
                                "name": "id",
                                "type": "string"
                            }
                        ]
                    },
                    "configure": {
                        "description": "Change the settings of a service.",
                        "params": [
                            {
                                "name": "id",
                                "type": "string"
                            },
                            {
                                "name": "opts",
                                "type": "object",
                                "required": [
                                    "sourceUrl"
                                ],
                                "properties": {
                                    "sourceUrl": {
                                        "type": "string",
                                        "format": "uri"
                                    },
                                    "desiredVersion": {
                                        "type": "string"
                                    },
                                    "port": {
                                        "type": "number"
                                    }
                                }
                            }
                        ]
                    },
                    "start": {
                        "description": "Start a service process.",
                        "params": [
                            {
                                "name": "id",
                                "type": "string"
                            }
                        ]
                    },
                    "stop": {
                        "description": "Stop a service process.",
                        "params": [
                            {
                                "name": "id",
                                "type": "string"
                            }
                        ]
                    },
                    "restart": {
                        "description": "Restart a service process.",
                        "params": [
                            {
                                "name": "id",
                                "type": "string"
                            }
                        ]
                    },
                    "checkForPackageUpdates": {
                        "description": "Query the source package for software updates.",
                        "params": [
                            {
                                "name": "id",
                                "type": "string"
                            }
                        ],
                        "response": {
                            "type": "object",
                            "required": [
                                "hasUpdate",
                                "installedVersion",
                                "latestVersion"
                            ],
                            "properties": {
                                "hasUpdate": {
                                    "type": "boolean"
                                },
                                "installedVersion": {
                                    "type": "string"
                                },
                                "latestVersion": {
                                    "type": "string"
                                }
                            }
                        }
                    },
                    "updatePackage": {
                        "description": "Update the service to the highest version which matches \"desiredVersion\".",
                        "params": [
                            {
                                "name": "id",
                                "type": "string"
                            }
                        ],
                        "response": {
                            "type": "object",
                            "required": [
                                "installedVersion",
                                "oldVersion"
                            ],
                            "properties": {
                                "installedVersion": {
                                    "type": "string"
                                },
                                "oldVersion": {
                                    "type": "string"
                                }
                            }
                        }
                    }
                },
                "emitters": {
                    "subscribeStdioLog": {
                        "description": "Subscribe to the service's stdio log.",
                        "params": [
                            {
                                "name": "id",
                                "type": "string"
                            }
                        ],
                        "events": {
                            "data": {
                                "text": {
                                    "type": "string"
                                }
                            }
                        }
                    }
                }
            }
        }, handlers);
    }
}
