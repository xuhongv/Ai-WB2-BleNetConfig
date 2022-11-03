const UUID_SERVICE = "0000FFFF-0000-1000-8000-00805F9B34FB";
const UUID_WRITE_CHARACTERISTIC = "0000FF01-0000-1000-8000-00805F9B34FB";
const UUID_READ_CHARACTERISTIC = "0000FF02-0000-1000-8000-00805F9B34FB";

const SUBTYPE_ACK = 0x00;
const SUBTYPE_SET_SEC_MODE = 0x01;
const SUBTYPE_SET_OP_MODE = 0x02;
const SUBTYPE_CONNECT_WIFI = 0x03;
const SUBTYPE_DISCONNECT_WIFI = 0x04;
const SUBTYPE_GET_WIFI_STATUS = 13;
const SUBTYPE_DEAUTHENTICATE = 0x06;
const SUBTYPE_GET_VERSION = 0x07;
const SUBTYPE_CLOSE_CONNECTION = 0x08;
const SUBTYPE_GET_WIFI_LIST = 0x09;
const SUBTYPE_GET_WIFI_EVERY_LIST = 0xB;

const SUBTYPE_ACK_SUCCESS = 0x00;
const SUBTYPE_NOT_READY = 0x01;

const PACKAGE_VALUE = 0x01;
const SUBTYPE_NEG = 0x00;
const SUBTYPE_STA_WIFI_BSSID = 0x01;
const SUBTYPE_STA_WIFI_SSID = 0x02;
const SUBTYPE_STA_WIFI_PASSWORD = 0x03;
const SUBTYPE_SOFTAP_WIFI_SSID = 0x04;
const SUBTYPE_SOFTAP_WIFI_PASSWORD = 0x05;
const SUBTYPE_SOFTAP_MAX_CONNECTION_COUNT = 0x06;
const SUBTYPE_SOFTAP_AUTH_MODE = 0x07;
const SUBTYPE_SOFTAP_CHANNEL = 0x08;
const SUBTYPE_USERNAME = 0x09;
const SUBTYPE_CA_CERTIFICATION = 0x0a;
const SUBTYPE_CLIENT_CERTIFICATION = 0x0b;
const SUBTYPE_SERVER_CERTIFICATION = 0x0c;
const SUBTYPE_CLIENT_PRIVATE_KEY = 0x0d;
const SUBTYPE_SERVER_PRIVATE_KEY = 0x0e;
const SUBTYPE_WIFI_CONNECTION_STATE = 0x0f;
const SUBTYPE_VERSION = 0x10;
const SUBTYPE_WIFI_LIST = 0x11;
const SUBTYPE_ERROR = 0x12;
const SUBTYPE_CUSTOM_DATA = 0x13;

const everyDateLength = 9;
const firstDateLength = 19;

var WIFI_STATE_ENUM_LIST = {
  WIFI_STATE_UNKNOWN                              : 0x00,
  WIFI_STATE_IDLE                                 : 0x01,
  WIFI_STATE_CONNECTING                           : 0x02,
  WIFI_STATE_CONNECTED_IP_GETTING                 : 0x03,
  WIFI_STATE_CONNECTED_IP_GOT                     : 0x04,
  WIFI_STATE_DISCONNECT                           : 0x05,
  WIFI_STATE_WITH_AP_IDLE                         : 0x11,
  WIFI_STATE_WITH_AP_CONNECTING                   : 0x12,
  WIFI_STATE_WITH_AP_CONNECTED_IP_GETTING         : 0x13,
  WIFI_STATE_WITH_AP_CONNECTED_IP_GOT             : 0x14,
  WIFI_STATE_WITH_AP_DISCONNECT                   : 0x15,
  WIFI_STATE_IFDOWN                               : 0x06,
  WIFI_STATE_SNIFFER                              : 0x07,
  WIFI_STATE_PSK_ERROR                            : 0x08,
  WIFI_STATE_NO_AP_FOUND                          : 0x09,
};


module.exports = {
  firstDateLength: firstDateLength,
  everyDateLength: everyDateLength,
  SUBTYPE_STA_WIFI_BSSID: SUBTYPE_STA_WIFI_BSSID,
  SUBTYPE_GET_WIFI_LIST: SUBTYPE_GET_WIFI_LIST,
  UUID_WRITE_CHARACTERISTIC: UUID_WRITE_CHARACTERISTIC,
  UUID_SERVICE: UUID_SERVICE,
  UUID_READ_CHARACTERISTIC: UUID_READ_CHARACTERISTIC,
  SUBTYPE_STA_WIFI_SSID: SUBTYPE_STA_WIFI_SSID,
  SUBTYPE_STA_WIFI_PASSWORD: SUBTYPE_STA_WIFI_PASSWORD,
  SUBTYPE_CONNECT_WIFI: SUBTYPE_CONNECT_WIFI,
  SUBTYPE_DISCONNECT_WIFI: SUBTYPE_DISCONNECT_WIFI,
  SUBTYPE_GET_VERSION: SUBTYPE_GET_VERSION,
  SUBTYPE_GET_WIFI_STATUS: SUBTYPE_GET_WIFI_STATUS,
  WIFI_STATE_ENUM_LIST: WIFI_STATE_ENUM_LIST,
  SUBTYPE_GET_WIFI_EVERY_LIST: SUBTYPE_GET_WIFI_EVERY_LIST,
}