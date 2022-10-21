export default {
	'247': {
		DESCRIPTION: 'Ang 24/7 nga mode kay nagpugong ni Quaver gikan sa pagbiya.',
		OPTION: { ENABLED: 'Kung gi-enable man o sa di ang 24/7 nga mode, kung wala gipiho, kay ma-toggle ni.' },
		RESPONSE: {
			ENABLED: 'Ang 24/7 ay **gi-enable**',
			DISABLED: 'Ang 24/7 ay **gi-disable**',
			FEATURE_NOT_WHITELISTED: 'Kini nga server wala gi-whitelist aron mogamit og 24/7.',
			QUEUE_CHANNEL_MISSING: 'Ang queue channel kay nawala. Sulayi gamita ang `bind` nga command.'
		},
		MISC: { NOTE: 'Si Quaver mogamit sa parehas nga mga voice ug text channel kung kini magsugod pag-usab.' }
	},
	BASSBOOST: {
		DESCRIPTION: 'Ang bass boost nga mode kay nagpadako sa mga level sa bass.',
		OPTION: { ENABLED: 'Kung gi-enable man o sa di ang bass boost nga mode, kung wala gipiho, kay ma-toggle ni.' },
		RESPONSE: {
			ENABLED: 'Ang bass boost kay **gi-enable**',
			DISABLED: 'Ang bass boost kay **gi-disable**'
		}
	},
	BIND: {
		DESCRIPTION: 'Usba ang channel nga gigamit ni Quaver aron awtomatiko nga magpadala og mga mensahe.',
		OPTION: { NEW_CHANNEL: 'Ang channel na i-bind.' },
		RESPONSE: {
			SUCCESS: 'Nakabind sa <#%1>',
			PERMISSIONS_INSUFFICIENT: 'Wala koy igong (mga) permission sa <#%1>.'
		}
	},
	CLEAR: {
		DESCRIPTION: 'I-clear ang queue.',
		RESPONSE: {
			SUCCESS: 'Ang queue kay na-clear.',
			QUEUE_EMPTY: 'Walay mga track sa queue aron ma clear.',
			CONFIRMATION: 'Sigurado ka ba nga gusto nimong i-clear ang queue?'
		}
	},
	DISCONNECT: {
		DESCRIPTION: 'Ipadiskonek si Quaver.',
		RESPONSE: {
			SUCCESS: 'Niguwas sa voice channel.',
			FEATURE_247_ENABLED: 'Si Quaver kay dili makabiya tungod kay ang 24/7 kay gi-enable.',
			CONFIRMATION: 'Sigurado ka ba nga gusto nimo ipadiskonekta si Quaver? Kini usab ma-clear ang queue.'
		}
	},
	INFO: {
		DESCRIPTION: 'Ipakita ang impormasyon bahin ni Quaver.',
		RESPONSE: { SUCCESS: 'Open-source nga music bot para sa ginagmay na mga komunidad.\nNagdagan sa bersyong `%1`.' },
		MISC: {
			SOURCE_CODE: 'Source Code',
			INVITE: 'I-imbitar',
			SPONSOR_US: 'Sponsor Namo'
		}
	},
	LOOP: {
		DESCRIPTION: 'Usba ang mode sa pag-loop.',
		OPTION: {
			TYPE: {
				DESCRIPTION: 'Ang looping mode.',
				OPTION: {
					DISABLED: 'Disabled',
					TRACK: 'Track',
					QUEUE: 'Queue'
				}
			}
		},
		RESPONSE: { SUCCESS: 'Ang looping mode gitakda sa **%1**' }
	},
	MOVE: {
		DESCRIPTION: 'Pagbalhin og track nga naa sulod sa queue.',
		OPTION: {
			OLD_POSITION: 'Ang posisyon sa track nga ibalhin.',
			NEW_POSITION: 'Ang bag-ong posisyon aron mabalhin ang track.'
		},
		RESPONSE: {
			SUCCESS: 'Nabalhin ang [**%1**](%2) `%3 -> %4`',
			QUEUE_INSUFFICIENT_TRACKS: 'Walay igong mga track sa queue aron makahimo og usa ka pagbalhin.',
			OUT_OF_RANGE: 'Ang imong input kay dili balido.',
			MOVING_IN_PLACE: 'Dili nimo mabalhin ang usa ka track sa parehas nga posisyon nga naa na niini.'
		}
	},
	NIGHTCORE: {
		DESCRIPTION: 'Ang nightcore mode kay magpapaspas sa imohang musika.',
		OPTION: { ENABLED: 'Kung gi-enable man o sa di ang nightcore, kung wala gipiho, kay ma-toggle ni.' },
		RESPONSE: {
			ENABLED: 'Ang nightcore ay **gi-enable**',
			DISABLED: 'Ang nightcore ay **gi-disable**'
		}
	},
	PAUSE: {
		DESCRIPTION: 'I-pause si Quaver.',
		RESPONSE: {
			SUCCESS: 'Gi-pause ang player.',
			STATE_UNCHANGED: 'Ang player kay napahunong na man.'
		}
	},
	PING: {
		DESCRIPTION: 'Ipakita ang latency ug uptime ni Quaver.',
		RESPONSE: { SUCCESS: 'Pong!%1' },
		MISC: { UPTIME: 'Uptime:' }
	},
	PLAY: {
		DESCRIPTION: 'Pagdugang og usa ka track sa queue.',
		OPTION: {
			QUERY: 'YouTube nga search query o usa ka link gikan sa Spotify o YouTube.',
			INSERT: 'Kung ipatugtug ba o sa di ang track nga nagsunod.'
		},
		RESPONSE: {
			NO_RESULTS: {
				DEFAULT: 'Walay nakit-an nga mga resulta gikan sa imong query.',
				SPOTIFY: 'Walay nakit-an nga resulta sa imohang query sa Spotify.'
			},
			DISABLED: { SPOTIFY: 'Ang integration sa Spotify kay wala na-configure.' },
			LOAD_FAILED: 'Napakyas sa pag-load sa track.'
		}
	},
	PLAYING: { DESCRIPTION: 'Ipakita unsay nagpatugtug karon.' },
	QUEUE: {
		DESCRIPTION: 'Ipakita ang queue.',
		RESPONSE: {
			QUEUE_EMPTY: 'Wala nay gasunod.',
			OUT_OF_RANGE: 'Ang imong input kay dili balido.'
		},
		MISC: {
			PAGE: 'Panid',
			MODAL_TITLE: 'Adto sa panid nga'
		}
	},
	REMOVE: {
		DESCRIPTION: 'Pagtangtang og track gikan sa queue.',
		OPTION: { POSITION: 'Ang posisyon sa track nga itangtang.' },
		RESPONSE: {
			SUCCESS: 'Gitangtang ang [**%1**](%2)',
			QUEUE_EMPTY: 'Walay mga track sa queue nga tangtangonon.'
		}
	},
	RESUME: {
		DESCRIPTION: 'Ipadayon si Quaver.',
		RESPONSE: {
			SUCCESS: 'Ang player kay gipadayon.',
			STATE_UNCHANGED: 'Ang player kay nagpatugtug na man.'
		}
	},
	SEARCH: {
		DESCRIPTION: 'Mangita sa YouTube og usa ka track.',
		OPTION: { QUERY: 'YouTube nga search query.' },
		RESPONSE: { USE_PLAY_CMD: 'Suwayig gamit ang play command imbis ana.' },
		MISC: { PICK: 'Pili og (mga) track' }
	},
	SEEK: {
		DESCRIPTION: 'Laktaw ngadto sa laing timestamp sa kasamtangang track.',
		OPTION: {
			HOURS: 'Ang posisyon sa oras para sa target nga timestamp.',
			MINUTES: 'Ang posisyon sa minuto para sa target nga timestamp.',
			SECONDS: 'Ang posisyon sa segundo para sa target nga timestamp.'
		},
		RESPONSE: {
			SUCCESS: 'Nagseek ngadto sa `[%1 / %2]`',
			TIMESTAMP_MISSING: 'Palihug pagpiho ug timestamp nga i-seek.',
			TIMESTAMP_INVALID: 'Ang timestamp nga gihatag milagpas sa duration sa track nga `%1`.',
			STREAM_CANNOT_SEEK: 'Ang seek dili magamit para sa mga stream.'
		}
	},
	SETTINGS: {
		DESCRIPTION: 'Usba ang mga setting ni Quaver sa dinhi nga server.',
		RESPONSE: { HEADER: 'Mga setting sa **%1**' },
		MISC: {
			LANGUAGE: {
				NAME: 'Lengguwahe',
				DESCRIPTION: 'Ang lengguwahe nga gamiton alang niini nga server.'
			},
			FORMAT: {
				NAME: 'Pormat',
				DESCRIPTION: 'Ang "Nagpatugtug karon" nga pormat nga gamiton alang niini nga server.',
				EXAMPLE: {
					SIMPLE: 'Simple nga Pagpakita sa Pormat',
					DETAILED: 'Detalyado nga Pagpakita sa Pormat'
				},
				OPTIONS: {
					SIMPLE: 'Simple',
					DETAILED: 'Detalyado'
				}
			}
		}
	},
	SHUFFLE: {
		DESCRIPTION: 'I-shuffle ang queue.',
		RESPONSE: {
			SUCCESS: 'Gi-shuffle ang queue.',
			QUEUE_INSUFFICIENT_TRACKS: 'Walay igong mga track sa queue aron makahimo og shuffle.'
		}
	},
	SKIP: {
		DESCRIPTION: 'Laktawi ang kasamtangang track.',
		RESPONSE: {
			SUCCESS: {
				DEFAULT: 'Gilaktawan ang [**%1**](%2)',
				VOTED: 'Nalaktawan ang [**%1**](%2) pinaagi sa boto'
			},
			VOTED: {
				SUCCESS: 'Giboto nga laktawan ang [**%1**](%2) `[%3 / %4]`',
				STATE_UNCHANGED: 'Nakaboto kana nga laktawan kini nga track.'
			}
		}
	},
	STOP: {
		DESCRIPTION: 'Ipahunong ang kasamtangang track ug i-clear ang queue.',
		RESPONSE: {
			SUCCESS: 'Gipahunong ang kasamtangang track ug na clear ang queue.',
			CONFIRMATION: 'Sigurado ka ba nga gusto nimong ihunong ang pagkakaron nga track ug i-clear ang queue?'
		}
	},
	VOLUME: {
		DESCRIPTION: 'I-adjust ang volume ni Quaver.',
		OPTION: { NEW_VOLUME: 'Ang bag-ong volume aron ma-adjust.' },
		RESPONSE: {
			SUCCESS: 'Gi-adjust ang volume sa `%1%`',
			OUT_OF_RANGE: 'Dili kana sulod sa balido nga range sa `0%` to `200%`.'
		}
	}
};