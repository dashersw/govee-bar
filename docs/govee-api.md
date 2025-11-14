Jump to Content
Govee Development Platform
Log In
v1.0
Home
Guides
API Reference
Changelog

Search
⌘K
JUMP TO
⌘/
Awesome New API
Apply Govee-API-Key
API Reference

Get You Devices
Control You Device
Get Device State
Get Dynamic Scene
Subscribe Device Event
Powered by

Get You Devices
Get you devices and capabilities

Device Types
devices.types.light
devices.types.air_purifier
devices.types.thermometer
devices.types.socket
devices.types.sensor
devices.types.heater
devices.types.humidifier
devices.types.dehumidifier
devices.types.ice_maker
devices.types.aroma_diffuser
devices.types.box
Capability Types
capabilities instance overview
devices.capabilities.on_off powerSwitch on/off enum options
devices.capabilities.toggle oscillationToggle,nightlightToggle,gradientToggle,ect on/off Enum options
devices.capabilities.range brightness,humidity,volume,temperature,ect set a range number
devices.capabilities.mode ngihtlightScene,presetScene,gearMode,fanSpeed,ect enum options
devices.capabilities.color_setting colorRgb,colorTemperatureK rgb or Kelvin color temperature
devices.capabilities.segment_color_setting segmentedBrightness,segmentedColorRgb set color or brightness on segment
devices.capabilities.music_setting musicMode set music mode
devices.capabilities.dynamic_scene lightScene,diyScene,snapshot set scene,but the options are not static
device.capabilities.work_mode workMode Set the working mode and give it a working value
device.capabilities.temperature_setting targetTemperature,sliderTemperature set temperature
Discover Devices
Get your devices from Govee ，it will return the capabilities，

request example
HTTP

GET /router/api/v1/user/devices HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx
response success example
JSON

{
"code": 200,
"message": "success",
"data": [
{
"sku": "H6601",
"device": "9D:FA:85:EB:D3:00:8B:FF",
"capabilities": [
{
"type": "devices.capabilities.on_off",
"instance": "powerSwitch",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
]
}
},
{
"type": "devices.capabilities.toggle",
"instance": "gradientToggle",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
]
}
},
{
"type": "devices.capabilities.range",
"instance": "brightness",
"parameters": {
"unit": "unit.percent",
"dataType": "INTEGER",
"range": {
"min": 1,
"max": 100,
"precision": 1
}
}
},
{
"type": "devices.capabilities.segment_color_setting",
"instance": "segmentedColorRgb",
"parameters": {
"dataType": "STRUCT",
"fields": [
{
"fieldName": "segment",
"dataType": "Array",
"options": [
{
"value": 0
},
{
"value": 1
},
{
"value": 2
},
{
"value": 3
},
{
"value": 4
},
{
"value": 5
},
{
"value": 6
},
{
"value": 7
},
{
"value": 8
},
{
"value": 9
},
{
"value": 10
},
{
"value": 11
},
{
"value": 12
},
{
"value": 13
},
{
"value": 14
}
],
"required": true
},
{
"fieldName": "rgb",
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 16777215,
"precision": 1
},
"required": true
}
]
}
},
{
"type": "devices.capabilities.color_setting",
"instance": "colorRgb",
"parameters": {
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 16777215,
"precision": 1
}
}
},
{
"type": "devices.capabilities.color_setting",
"instance": "colorTemperatureK",
"parameters": {
"dataType": "INTEGER",
"range": {
"min": 2000,
"max": 9000,
"precision": 1
}
}
},
{
"type": "devices.capabilities.dynamic_scene",
"instance": "lightScene",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "Tudum",
"value": 3054
},
{
"name": "Party",
"value": 3055
},
{
"name": "Dance Party",
"value": 3056
},
{
"name": "Dine Together",
"value": 3057
},
{
"name": "Dating",
"value": 3058
},
{
"name": "Adventure",
"value": 3059
},
{
"name": "Technology",
"value": 3060
},
{
"name": "Sports",
"value": 3061
},
{
"name": "Dreamlike",
"value": 3062
},
{
"name": "Dynamic",
"value": 3063
},
{
"name": "Blossom",
"value": 3064
},
{
"name": "Christmas",
"value": 3065
},
{
"name": "Halloween",
"value": 3066
},
{
"name": "Fireworks",
"value": 3067
},
{
"name": "Ghost",
"value": 3068
},
{
"name": "Easter",
"value": 3069
},
{
"name": "Valentine's Day",
"value": 3070
},
{
"name": "Spin",
"value": 3071
},
{
"name": "Stacking",
"value": 3072
},
{
"name": "Shoot",
"value": 3073
},
{
"name": "Racing",
"value": 3074
},
{
"name": "Poker",
"value": 3075
},
{
"name": "Crossing",
"value": 3076
},
{
"name": "Fight",
"value": 3077
},
{
"name": "Electro Dance",
"value": 3078
},
{
"name": "Swing",
"value": 3079
},
{
"name": "Candy Crush",
"value": 3080
},
{
"name": "Portal",
"value": 3081
},
{
"name": "Freeze",
"value": 3082
},
{
"name": "Excited",
"value": 3083
},
{
"name": "Tension",
"value": 3084
},
{
"name": "Fright",
"value": 3085
},
{
"name": "Energetic",
"value": 3086
},
{
"name": "Doubt",
"value": 3087
},
{
"name": "Meditation",
"value": 3088
},
{
"name": "Daze",
"value": 3089
},
{
"name": "Action",
"value": 3090
},
{
"name": "Rivalry",
"value": 3091
},
{
"name": "Puzzle Game",
"value": 3092
},
{
"name": "Shooting Game",
"value": 3093
},
{
"name": "Racing Game",
"value": 3094
},
{
"name": "Card Playing",
"value": 3095
}
]
}
},
{
"type": "devices.capabilities.music_setting",
"instance": "musicMode",
"parameters": {
"dataType": "STRUCT",
"fields": [
{
"fieldName": "musicMode",
"dataType": "ENUM",
"options": [
{
"name": "Energic",
"value": 5
},
{
"name": "Rhythm",
"value": 3
},
{
"name": "Spectrum",
"value": 6
},
{
"name": "Rolling",
"value": 4
}
],
"required": true
},
{
"unit": "unit.percent",
"fieldName": "sensitivity",
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 100,
"precision": 1
},
"required": true
},
{
"fieldName": "autoColor",
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
],
"required": false
},
{
"unit": "unit.percent",
"fieldName": "rgb",
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 16777215,
"precision": 1
},
"required": true
}
]
}
},
{
"type": "devices.capabilities.dynamic_scene",
"instance": "diyScene",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "Fade",
"value": 8216567
}
]
}
},
{
"type": "devices.capabilities.dynamic_scene",
"instance": "snapshot",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "Sunrise",
"value": 0
},
{
"name": "Sunset",
"value": 1
}
]
}
}
]
},
{
"sku": "H605C",
"device": "69:EC:D1:37:36:39:24:4B",
"capabilities": [
{
"type": "devices.capabilities.on_off",
"instance": "powerSwitch",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
]
}
},
{
"type": "devices.capabilities.toggle",
"instance": "gradientToggle",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
]
}
},
{
"type": "devices.capabilities.range",
"instance": "brightness",
"parameters": {
"unit": "unit.percent",
"dataType": "INTEGER",
"range": {
"min": 1,
"max": 100,
"precision": 1
}
}
},
{
"type": "devices.capabilities.segment_color_setting",
"instance": "segmentedColorRgb",
"parameters": {
"dataType": "STRUCT",
"fields": [
{
"fieldName": "segment",
"dataType": "Array",
"options": [
{
"value": 0
},
{
"value": 1
},
{
"value": 2
},
{
"value": 3
},
{
"value": 4
},
{
"value": 5
},
{
"value": 6
},
{
"value": 7
},
{
"value": 8
},
{
"value": 9
},
{
"value": 10
},
{
"value": 11
},
{
"value": 12
},
{
"value": 13
},
{
"value": 14
}
],
"required": true
},
{
"fieldName": "rgb",
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 16777215,
"precision": 1
},
"reauired": true
}
]
}
},
{
"type": "devices.capabilities.color_setting",
"instance": "colorRgb",
"parameters": {
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 16777215,
"precision": 1
}
}
},
{
"type": "devices.capabilities.color_setting",
"instance": "colorTemperatureK",
"parameters": {
"dataType": "INTEGER",
"range": {
"min": 2000,
"max": 9000,
"precision": 1
}
}
},
{
"type": "devices.capabilities.dynamic_scene",
"instance": "lightScene",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "Tudum",
"value": 3054
},
{
"name": "Party",
"value": 3055
},
{
"name": "Dance Party",
"value": 3056
},
{
"name": "Dine Together",
"value": 3057
},
{
"name": "Dating",
"value": 3058
},
{
"name": "Adventure",
"value": 3059
},
{
"name": "Technology",
"value": 3060
},
{
"name": "Sports",
"value": 3061
},
{
"name": "Dreamlike",
"value": 3062
},
{
"name": "Dynamic",
"value": 3063
},
{
"name": "Blossom",
"value": 3064
},
{
"name": "Christmas",
"value": 3065
},
{
"name": "Halloween",
"value": 3066
},
{
"name": "Fireworks",
"value": 3067
},
{
"name": "Ghost",
"value": 3068
},
{
"name": "Easter",
"value": 3069
},
{
"name": "Valentine's Day",
"value": 3070
},
{
"name": "Spin",
"value": 3071
},
{
"name": "Stacking",
"value": 3072
},
{
"name": "Shoot",
"value": 3073
},
{
"name": "Racing",
"value": 3074
},
{
"name": "Poker",
"value": 3075
},
{
"name": "Crossing",
"value": 3076
},
{
"name": "Fight",
"value": 3077
},
{
"name": "Electro Dance",
"value": 3078
},
{
"name": "Swing",
"value": 3079
},
{
"name": "Candy Crush",
"value": 3080
},
{
"name": "Portal",
"value": 3081
},
{
"name": "Freeze",
"value": 3082
},
{
"name": "Excited",
"value": 3083
},
{
"name": "Tension",
"value": 3084
},
{
"name": "Fright",
"value": 3085
},
{
"name": "Energetic",
"value": 3086
},
{
"name": "Doubt",
"value": 3087
},
{
"name": "Meditation",
"value": 3088
},
{
"name": "Daze",
"value": 3089
},
{
"name": "Action",
"value": 3090
},
{
"name": "Rivalry",
"value": 3091
},
{
"name": "Puzzle Game",
"value": 3092
},
{
"name": "Shooting Game",
"value": 3093
},
{
"name": "Racing Game",
"value": 3094
},
{
"name": "Card Playing",
"value": 3095
}
]
}
},
{
"type": "devices.capabilities.music_setting",
"instance": "musicMode",
"parameters": {
"dataType": "STRUCT",
"fields": [
{
"fieldName": "musicMode",
"dataType": "ENUM",
"options": [
{
"name": "Energic",
"value": 5
},
{
"name": "Rhythm",
"value": 3
},
{
"name": "Spectrum",
"value": 4
},
{
"name": "Rolling",
"value": 6
}
],
"required": true
},
{
"unit": "unit.percent",
"fieldName": "sensitivity",
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 100,
"precision": 1
},
"required": true
},
{
"fieldName": "autoColor",
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
],
"required": false
},
{
"fieldName": "rgb",
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 16777215,
"precision": 1
},
"required": true
}
]
}
},
{
"type": "devices.capabilities.dynamic_setting",
"instance": "diyScene",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "fade",
"value": 8216567
}
]
}
},
{
"type": "devices.capabilities.dynamic_scene",
"instance": "snapshot",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "color scene",
"value": 465503
}
]
}
}
]
},
{
"sku": "H7055",
"device": "B6:21:C3:37:34:32:33:86",
"capabilities": [
{
"type": "devices.capabilities.on_off",
"instance": "powerSwitch",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
]
}
},
{
"type": "devices.capabilities.toggle",
"instance": "gradientToggle",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
]
}
},
{
"type": "devices.capabilities.range",
"instance": "brightness",
"parameters": {
"unit": "unit.percent",
"dataType": "INTEGER",
"range": {
"min": 1,
"max": 100,
"precision": 1
}
}
},
{
"type": "devices.capabilities.segment_color_setting",
"instance": "segmentedColorRgb",
"parameters": {
"dataType": "STRUCT",
"fields": [
{
"fieldName": "segment",
"dataType": "Array",
"options": [
{
"value": 0
},
{
"value": 1
},
{
"value": 2
},
{
"value": 3
},
{
"value": 4
},
{
"value": 5
},
{
"value": 6
},
{
"value": 7
},
{
"value": 8
},
{
"value": 9
},
{
"value": 10
},
{
"value": 11
},
{
"value": 12
},
{
"value": 13
},
{
"value": 14
}
],
"required": true
},
{
"fieldName": "rgb",
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 16777215,
"precision": 1
},
"required": true
}
]
}
},
{
"type": "devices.capabilities.color_setting",
"instance": "colorRgb",
"parameters": {
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 16777215,
"precision": 1
}
}
},
{
"type": "devices.capabilities.color_setting",
"instance": "colorTemperatureK",
"parameters": {
"dataType": "INTEGER",
"range": {
"min": 2000,
"max": 9000,
"precision": 1
}
}
},
{
"type": "devices.capabilities.dynamic_scene",
"instance": "lightScene",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "Tudum",
"value": 3054
},
{
"name": "Party",
"value": 3055
},
{
"name": "Dance Party",
"value": 3056
},
{
"name": "Dine Together",
"value": 3057
},
{
"name": "Dating",
"value": 3058
},
{
"name": "Adventure",
"value": 3059
},
{
"name": "Technology",
"value": 3060
},
{
"name": "Sports",
"value": 3061
},
{
"name": "Dreamlike",
"value": 3062
},
{
"name": "Dynamic",
"value": 3063
},
{
"name": "Blossom",
"value": 3064
},
{
"name": "Christmas",
"value": 3065
},
{
"name": "Halloween",
"value": 3066
},
{
"name": "Fireworks",
"value": 3067
},
{
"name": "Ghost",
"value": 3068
},
{
"name": "Easter",
"value": 3069
},
{
"name": "Valentine's Day",
"value": 3070
},
{
"name": "Spin",
"value": 3071
},
{
"name": "Stacking",
"value": 3072
},
{
"name": "Shoot",
"value": 3073
},
{
"name": "Racing",
"value": 3074
},
{
"name": "Poker",
"value": 3075
},
{
"name": "Crossing",
"value": 3076
},
{
"name": "Fight",
"value": 3077
},
{
"name": "Electro Dance",
"value": 3078
},
{
"name": "Swing",
"value": 3079
},
{
"name": "Candy Crush",
"value": 3080
},
{
"name": "Portal",
"value": 3081
},
{
"name": "Freeze",
"value": 3082
},
{
"name": "Excited",
"value": 3083
},
{
"name": "Tension",
"value": 3084
},
{
"name": "Fright",
"value": 3085
},
{
"name": "Energetic",
"value": 3086
},
{
"name": "Doubt",
"value": 3087
},
{
"name": "Meditation",
"value": 3088
},
{
"name": "Daze",
"value": 3089
},
{
"name": "Action",
"value": 3090
},
{
"name": "Rivalry",
"value": 3091
},
{
"name": "Puzzle Game",
"value": 3092
},
{
"name": "Shooting Game",
"value": 3093
},
{
"name": "Racing Game",
"value": 3094
},
{
"name": "Card Playing",
"value": 3095
}
]
}
},
{
"type": "devices.capabilities.music_setting",
"instance": "musicMode",
"parameters": {
"dataType": "STRUCT",
"fields": [
{
"fieldName": "musicMode",
"dataType": "ENUM",
"options": [
{
"name": "Energic",
"value": 5
},
{
"name": "Rhythm",
"value": 3
},
{
"name": "Spectrum",
"value": 6
},
{
"name": "Rolling",
"value": 4
}
],
"required": true
},
{
"unit": "unit.percent",
"fieldName": "sensitivity",
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 100,
"precision": 1
},
"required": true
},
{
"fieldName": "autoColor",
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
],
"required": false
},
{
"unit": "unit.percent",
"fieldName": "rgb",
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 16777215,
"precision": 1
},
"required": true
}
]
}
},
{
"type": "devices.capabilities.dynamic_scene",
"instance": "diyScene",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "Fade",
"value": 8216567
}
]
}
},
{
"type": "devices.capabilities.dynamic_scene",
"instance": "snapshot",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "Sunrise",
"value": 0
},
{
"name": "Sunset",
"value": 1
}
]
}
}
]
}
]
}
response field
field data type
sku String Product model
device String device id
deviceName String The device name in Govee Home App.
capabilities Array device capabilities array
capabilities array
field data type
type String capbility type
instance String capability instance
parameters Object the struct definition of control command in this instance
parameters object
enum type parameters
field data type desc
dataType String define the data type of control value .
e.g. ENUM,INTEGER,STRUCT
options Array show the options of control value
options.name String show the name of this option
options.value -- the control value
integer type parameters
field data type desc
dataType String define the data type of control value .
e.g. ENUM,INTEGER,STRUCT
range Object define the range of value
range.max Integer the max of control value
range.min Integer the min of control value
range.precision Integer the precision of control value
unit String the unit of this control value e.g. temperature Celsius,temperature Fahrenheit
struct type parameters
field data type desc
dataType String define the data type of control value .
e.g. ENUM,INTEGER,STRUCT
fields Array when control value is struct, define the struct filed
Array.fieldName String the struct field name
Array.dataType String define the field data type
e.g. ENUM,INTEGER,STRUCT
Array.required Boolean required of this field
http code
code desc
200 success
429 too many request, request limits, 10000/Account/Day
401 Unauthorized. check you apiKey
Friendly Reminder
if the request response 429, means request limits happens, 10000/Account/Day
Updated about 8 hours ago

Apply Govee-API-Key
Control You Device
Did this page help you?
Table of Contents
Device Types
Capability Types
Discover Devices

Jump to Content
Govee Development Platform
Log In
v1.0
Home
Guides
API Reference
Changelog

Search
⌘K
JUMP TO
⌘/
Awesome New API
Apply Govee-API-Key
API Reference

Get You Devices
Control You Device
Get Device State
Get Dynamic Scene
Subscribe Device Event
Powered by

Control You Device
On_off
devices.capabilities.on_off

In this capability you can control the device power on/off

instance overview
powerSwitch powerSwitch
description of this capability
the parameters object defines how to pass parameters to control device

JSON

{
"sku": "H713B",
"device": "AC:3B:D4:AD:FC:B5:BA:CC",
"capabilities": [
...
{
"type": "devices.capabilities.on_off",
"instance": "powerSwitch",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
]
}
}
...
]
}
example of request
HTTP

POST /router/api/v1/device/control HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx

{
"requestId": "uuid",
"payload": {
"sku": "H605C",
"device": "64:09:C5:32:37:36:2D:13",
"capability": {
"type": "devices.capabilities.on_off",
"instance": "powerSwitch",
"value": 0
}
}
}
parameters
field type required overview
requestId String Yes unique id in this request, will be carried back in response body
payload Object -- request payload
payload.sku String Yes the product model
payload.device String Yes the device id
payload.capability Object -- the device capability to be controlled
capability.type String Yes the type of this capability
capability.instance String Yes the instance of this capability e.g. powerSwitch,
capability.value String Yes the control value of this instance, defin in '/router/api/v1/user/devices', see the parameters
Toggle
devices.capabilities.toggle

In this capability you can control the device small switch like oscillation ,nightlight

instance overview
oscillationToggle used for Fan,Heater,Thermostat
nightlightToggle used for appliances with night light
airDeflectorToggle used for Fan Heater Air Condition
gradientToggle used for Light color gradient
thermostatToggle used for Heater
warmMistToggle used for Humidifier
description of this capability
provided two command value 0 is off ,1 is on

JSON

{
"sku": "H713B",
"device": "AC:3B:D4:AD:FC:B5:BA:CC",
"capabilities": [
...
{
"type": "devices.capabilities.toggle",
"instance": "oscillationToggle",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
]
}
}
...
]
}
example of request
HTTP

POST /router/api/v1/device/control HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx

{
"requestId": "uuid",
"payload": {
"sku": "H605C",
"device": "64:09:C5:32:37:36:2D:13",
"capability": {
"type": "devices.capabilities.toggle",
"instance": "oscillationToggle",
"value": 0
}
}
}
Color_setting
devices.capabilities.color_setting

list of instance
instance overview
colorRgb setting the light color
colorTemperatureK setting the color temperature in Kelvin，
JSON
JSON

{
"sku": "H713B",
"device": "AC:3B:D4:AD:FC:B5:BA:CC",
"capabilities": [
...
{
"type": "devices.capabilities.color_setting",
"instance": "colorTemperatureK",
"parameters": {
"dataType": "INTEGER",
"range": {
"min": 2000,
"max": 9000,
"precision": 1
}
}
},
...
]
}
example of request
The instance colorRgb can change light color. You can get RGB number by combining red, green, and blue values.

HTTP
HTTP

POST /router/api/v1/device/control HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx

{
"requestId": "uuid",
"payload": {
"sku": "H605C",
"device": "64:09:C5:32:37:36:2D:13",
"capability": {
"type": "devices.capabilities.color_setting",
"instance": "colorRgb",
"value": 0
}
}
}
Mode
devices.capabilities.mode

In this capability you can switch the mode, such as the night light scene

list of instance
instance overview
nightlightScene switch the night scene, used for appliance with night light
presetScene used for devices.types.aroma_diffuser, preset scenes
example description of this capability
provided value options

JSON

{
"sku": "H713B",
"device": "AC:3B:D4:AD:FC:B5:BA:CC",
"capabilities": [
...
{
"type": "devices.capabilities.mode",
"instance": "nightlightScene",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "Forest",
"value": 1
},
{
"name": "Ocean",
"value": 2
},
{
"name": "Wetland",
"value": 3
},
{
"name": "Leisurely",
"value": 4
},
{
"name": "ASleep",
"value": 5
}
]
}
},
...
]
}

example of request
HTTP

POST /router/api/v1/device/control HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx

{
"requestId": "1",
"payload": {
"sku": "H7131",
"device": "64:09:C5:32:37:36:2D:13",
"capability": {
"type": "devices.capabilities.mode",
"instance": "nightlightScene",
"value": 1
}
}
}
Range
devices.capabilities.range

Manage device parameters that have a range. For example, lamp brightness, sound volume, heater temperature, humidifier humidity

list of instance
instance overview
brightness setting the brightness, used for 'devices.types.light'
humidity setting humidity, used for 'devices.types.humidifier'
example description of this capability
parameters object defines how to pass parameters to change adjust the range of brightness

JSON

{
"sku": "H605C",
"device": "64:09:C5:32:37:36:2D:13",
"capabilities": [
...
{
"type": "devices.capabilities.range",
"instance": "brightness",
"parameters": {
"dataType": "INTEGER",
"range": {
"min": 1,
"max": 100,
"precision": 1
}
}
},
...
]
}
example of request
HTTP
HTTP

POST /router/api/v1/device/control HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx

{
"requestId": "1",
"payload": {
"sku": "H605C",
"device": "64:09:C5:32:37:36:2D:13",
"capability": {
"type": "devices.capabilities.range",
"instance": "brightness",
"value": 50
}
}
}
Work_mode
devices.capabilities.work_mode

In this capability, you can set the working mode of the device and set its working values.

list of instance
instance overview
workMode device work mode
example of this capability
JSON

{
"sku": "H713B",
"device": "AC:3B:D4:AD:FC:B5:BA:CC",
"capabilities": [
...
{
"type": "devices.capabilities.work_mode",
"instance": "workMode",
"parameters": {
"dataType": "STRUCT",
"fields": [
{
"fieldName": "workMode",
"dataType": "ENUM",
"options": [
{
"name": "gearMode",
"value": 1
},
{
"name": "Fan",
"value": 9
},
{
"name": "Auto",
"value": 3
}
],
"required": true
},
{
"fieldName": "modeValue",
"dataType": "ENUM",
"options": [
{
"name": "gearMode",
"options": [
{
"name": "Low",
"value": 1
},
{
"name": "Medium",
"value": 2
},
{
"name": "High",
"value": 3
}
]
},
{
"defaultValue": 0,
"name": "Fan"
},
{
"defaultValue": 22,
"name": "Auto"
}
],
"required": true
}
]
}
}
...
]
}
example of request
HTTP

POST /router/api/v1/device/control HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx

{
"requestId": "1",
"payload": {
"sku": "H713B",
"device": "AC:3B:D4:AD:FC:B5:BA:CC",
"capability": {
"type": "devices.capabilities.work_mode",
"instance": "workMode",
"value": {
"workMode":1
"modeValue":1
}
}
}
}
value object parameters
field type required overview
workMode Integer Yes the temperature Whether to maintain or auto stop. 1. autoStop,0.maintain ,default 0
modeValue Integer No the target temperature to set
Segment_color_setting
devices.capabilities.segment_color_setting

In this capability, you can set color on several segment, when you light strip support segmented color

list of instance
instance overview
segmentedColorRgb setting the segmentedColorRgb,
segmentedBrightness setting the segmentedBrightness
example of this capability
JSON

{
"sku": "H713B",
"device": "AC:3B:D4:AD:FC:B5:BA:CC",
"capabilities": [
...
{
"type": "devices.capabilities.segment_color_setting",
"instance": "segmentedBrightness",
"parameters": {
"dataType": "STRUCT",
"fields": [
{
"fieldName": "segment",
"size": {
"min": 1,
"max": 15
},
"dataType": "Array",
"elementRange": {
"min": 0,
"max": 14
},
"elementType": "INTEGER",
"required": true
},
{
"fieldName": "brightness",
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 100,
"precision": 1
},
"required": true
}
]
}
},
...
]
}
example of request
value is a structure, segment is an array, pointing to the segment of the light strip.

HTTP
HTTP

POST /router/api/v1/device/control HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx

{
"requestId": "1",
"payload": {
"sku": "H605C",
"device": "64:09:C5:32:37:36:2D:13",
"capability": {
"type": "devices.capabilities.segment_color_setting",
"instance": "segmentedColorRgb",
"value": {
"segment":[0,1,2,3,4,5,6,7,8],
"rgb":0x0000ff
}
}
}
}
parameters
field type required overview
segment Array Yes the segment of the light strip, see govee app
brightness Integer No set brightness when instance is segmentedBrightness
rgb Integer No set color when instance is segmentedColorRgb, RGB value from 0 to 16777215
Dynamic_scene
devices.capabilities.dynamic_scene

dynamic_scene means you should edit in govee app such as Scene DIY Snapshot, then get these options from the interface

Temperature_setting
You can set the temperature and choose whether to stop automatically. In addition, you can also choose the temperature unit.

list of instance
instance overview
targetTemperature setting the thermostat temperature, used for 'devices.types.heater' or 'devices.types.thermostat'
sliderTemperature setting temperature , used for 'devices.types.kettle'
example of this capability
You will pass an structure type value，which describes the parameters required to set the temperature

JSON

{
"sku": "H713B",
"device": "AC:3B:D4:AD:FC:B5:BA:CC",
"capabilities": [
...
{
"type": "devices.capabilities.temperature_setting",
"instance": "targetTemperature",
"parameters": {
"dataType": "STRUCT",
"fields": [
{
"fieldName": "autoStop",
"defaultValue": 0,
"dataType": "ENUM",
"options": [
{
"name": "Auto Stop",
"value": 1
},
{
"name": "Maintain",
"value": 0
}
],
"required": false
},
{
"fieldName": "temperature",
"dataType": "INTEGER",
"range": {
"min": 5,
"max": 30,
"precision": 1
},
"required": true
},
{
"fieldName": "unit",
"defaultValue": "Celsius",
"dataType": "ENUM",
"options": [
{
"name": "Celsius",
"value": "Celsius"
},
{
"name": "Fahrenheit",
"value": "Fahrenheit"
}
],
"required": true
}
]
}
},
...
]
}
example of request
HTTP
HTTP

POST /router/api/v1/device/control HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx

{
"requestId": "1",
"payload": {
"sku": "H713B",
"device": "AC:3B:D4:AD:FC:B5:BA:CC",
"capability": {
"type": "devices.capabilities.temperature_setting",
"instance": "teargetTemperature",
"value": {
"temperature":25
"unit":"Celsius"
}
}
}
}
value object parameters
field type required overview
autoStop Integer No the temperature Whether to maintain or auto stop. 1. autoStop,0.maintain ,default 0
temperature Integer Yes the target temperature to set
unit String No the temperature unit , Celsius or Fahrenheit ,default Celsius
failure response
example of response

failure reason
code overview
400 Missing Parameter
400 Parameter value cannot be empty
400 Invalid parameter format
400 Invalid parameter type
400 Parameter value out of range
400 Parameter length does not meet requirements
400 Duplicate parameter value
404 Instance Not Fund
404 device not found
429 too many request ,the limits
Friendly Reminder
if the request response 429, means request limits happens, 10000/Account/Day

Updated 19 minutes ago

Get You Devices
Get Device State
Did this page help you?
Table of Contents
On_off
Toggle
Color_setting
Mode
Range
Work_mode
Segment_color_setting
Dynamic_scene
Temperature_setting
failure response
Jump to Content
Govee Development Platform
Log In
v1.0
Home
Guides
API Reference
Changelog

Search
⌘K
JUMP TO
⌘/
Awesome New API
Apply Govee-API-Key
API Reference

Get You Devices
Control You Device
Get Device State
Get Dynamic Scene
Subscribe Device Event
Powered by

Get Device State
Query Device's State
Query the current status of the device through device and sku.

example for lights and appliances
capabilities
JSON

{
"sku": "H7143",
"device": "BA:82:D4:AD:FC:94:A1:D8",
"deviceName": "Smart Humidifier",
"type": "devices.types.humidifier",
"capabilities": [
{
"type": "devices.capabilities.on_off",
"instance": "powerSwitch",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
]
}
},
{
"type": "devices.capabilities.toggle",
"instance": "warmMistToggle",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
]
}
},
{
"type": "devices.capabilities.work_mode",
"instance": "workMode",
"parameters": {
"dataType": "STRUCT",
"fields": [
{
"fieldName": "workMode",
"dataType": "ENUM",
"options": [
{
"name": "Manual",
"value": 1
},
{
"name": "Auto",
"value": 3
}
],
"required": true
},
{
"fieldName": "modeValue",
"dataType": "ENUM",
"options": [
{
"name": "Manual",
"options": [
{
"value": 1
},
{
"value": 2
},
{
"value": 3
},
{
"value": 4
},
{
"value": 5
},
{
"value": 6
},
{
"value": 7
},
{
"value": 8
},
{
"value": 9
}
]
},
{
"defaultValue": 0,
"name": "Auto"
}
],
"required": false
}
]
}
},
{
"type": "devices.capabilities.range",
"instance": "humidity",
"parameters": {
"dataType": "INTEGER",
"range": {
"min": 40,
"max": 80,
"precision": 1
}
}
},
{
"type": "devices.capabilities.toggle",
"instance": "nightlightToggle",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "on",
"value": 1
},
{
"name": "off",
"value": 0
}
]
}
},
{
"type": "devices.capabilities.range",
"instance": "brightness",
"parameters": {
"dataType": "INTEGER",
"range": {
"min": 1,
"max": 100,
"precision": 1
}
}
},
{
"type": "devices.capabilities.color_setting",
"instance": "colorRgb",
"parameters": {
"dataType": "INTEGER",
"range": {
"min": 0,
"max": 16777215,
"precision": 1
}
}
},
{
"type": "devices.capabilities.mode",
"instance": "nightlightScene",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "Forest",
"value": 1
},
{
"name": "Ocean",
"value": 2
},
{
"name": "Wetland",
"value": 3
},
{
"name": "Leisurely",
"value": 4
},
{
"name": "ASleep",
"value": 5
}
]
}
},
{
"type": "devices.capabilities.event",
"instance": "lackWaterEvent",
"alarmType": 51,
"eventState": {
"options": [
{
"name": "lackWater",
"value": 1,
"message": "Lack of Water"
}
]
}
}
]
},
request example
HTTP

POST /router/api/v1/device/state HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx

{
"requestId": "uuid",
"payload": {
"sku": "H7143",
"device": "52:8B:D4:AD:FC:45:5D:FE"
}
}
response success example
JSON

{
"requestId": "uuid",
"msg": "success",
"code": 200,
"payload": {
"sku": "H7143",
"device": "52:8B:D4:AD:FC:45:5D:FE",
"capabilities": [
{
"type": "devices.capabilities.online",
"instance": "online",
"state": {
"value": false
}
},
{
"type": "devices.capabilities.on_off",
"instance": "powerSwitch",
"state": {
"value": 0
}
},
{
"type": "devices.capabilities.toggle",
"instance": "warmMistToggle",
"state": {
"value": 0
}
},
{
"type": "devices.capabilities.work_mode",
"instance": "workMode",
"state": {
"value": {
"workMode": 3,
"modeValue": 9
}
}
},
{
"type": "devices.capabilities.range",
"instance": "humidity",
"state": {
"value": ""
}
},
{
"type": "devices.capabilities.toggle",
"instance": "nightlightToggle",
"state": {
"value": 1
}
},
{
"type": "devices.capabilities.range",
"instance": "brightness",
"state": {
"value": 5
}
},
{
"type": "devices.capabilities.color_setting",
"instance": "colorRgb",
"state": {
"value": 16777215
}
},
{
"type": "devices.capabilities.mode",
"instance": "nightlightScene",
"state": {
"value": 5
}
}
]
}
}

example for sensor
capabilities
JSON

{
"sku": "H5140",
"device": "FD:C8:DC:1E:D5:51:65:24",
"deviceName": "Smart CO2 Monitor",
"type": "devices.types.air_quality_monitor",
"capabilities": [
{
"type": "devices.capabilities.property",
"instance": "carbonDioxideConcentration"
},
{
"type": "devices.capabilities.property",
"instance": "sensorTemperature"
},
{
"type": "devices.capabilities.property",
"instance": "sensorHumidity"
}]
}

request
HTTP

POST /router/api/v1/device/state HTTP/1.1
Host: test-openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: f3c79a11-d6d6-479b-87b5-3d160320edb9
Content-Length: 138

{
"requestId": "6efd6c77-a0ec-4a0c-8e35-e88f73ce76ea",
"payload": {
"sku": "H5140",
"device": "FD:C8:DC:1E:D5:51:65:24"

}
}
response
JSON

{
"requestId": "6efd6c77-a0ec-4a0c-8e35-e88f73ce76ea",
"msg": "success",
"code": 200,
"payload": {
"sku": "H5140",
"device": "FD:C8:DC:1E:D5:51:65:24",
"capabilities": [
{
"type": "devices.capabilities.online",
"instance": "online",
"state": {
"value": true
}
},
{
"type": "devices.capabilities.property",
"instance": "carbonDioxideConcentration",
"state": {
"value": 1590
}
},
{
"type": "devices.capabilities.property",
"instance": "sensorTemperature",
"state": {
"value": 79.52
}
},
{
"type": "devices.capabilities.property",
"instance": "sensorHumidity",
"state": {
"value": 61.2
}
}
]
}
}

response field
field data type
sku String Product model
device String device id
deviceName String The device name in Govee Home App.
capabilities Array device capabilities array
Capabilities Array

field data type
type String capbility type
instance String capability instance
state Object the struct definition of current state in this instance
State Define Object

enum control value
field data type desc
value Object The type of value depends on the dataType returned by Get You Device.
In capabilities, if type is 'devices.capabilities.online', it indicates whether the device is wifi online. If it is false, the status data queried is historical data and has no reference significance. If state is true, it means the device is online, and the returned value is the value of the current device status. These values ​​correspond to the list returned by Get You Device. If the value value is empty, it means that the instance does not support query.

In capabilities, if the type is 'devices.capabilities.event', this is a property of real-time monitoring. It will only be reported when the event occurs on the device and cannot be obtained through query. If you want to obtain the status in real time, please refer to 'Subscribe Device Event' interface

Friendly Reminder
if the request response 429, means request limits happens, 10000/Account/Day
Updated 2 days ago

Control You Device
Get Dynamic Scene
Did this page help you?
Table of Contents
Query Device's State
example for lights and appliances
example for sensor
response field
Jump to Content
Govee Development Platform
Log In
v1.0
Home
Guides
API Reference
Changelog

Search
⌘K
JUMP TO
⌘/
Awesome New API
Apply Govee-API-Key
API Reference

Get You Devices
Control You Device
Get Device State
Get Dynamic Scene
Subscribe Device Event
Powered by

Get Dynamic Scene
Query Device's Light Scene
Query Dynamic Light Scene of the device through device and sku. The scene found by this interface is a dynamic scene. The scene found by getting the device list(Get You Devices) is a static scene, but their control methods are the same. The reason why the scene is divided into two parts is because the number of dynamic scenes will be relatively large.

request example
HTTP

POST /router/api/v1/device/scenes HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx

{
"requestId": "uuid",
"payload": {
"sku": "H618E",
"device": "8C:2E:9C:04:A0:03:82:D1"
}
}
response success example
JSON

{
"requestId": "uuid",
"msg": "success",
"code": 200,
"payload": {
"sku": "H6057",
"device": "2F:56:C1:9A:7C:E8:5B:19",
"capabilities": [
{
"type": "devices.capabilities.dynamic_scene",
"instance": "lightScene",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "Sunrise",
"value": {
"paramId": 4280,
"id": 3853
}
},
{
"name": "Sunset",
"value": {
"paramId": 4281,
"id": 3854
}
},
{
"name": "Sunset Glow",
"value": {
"paramId": 4282,
"id": 3855
}
},
{
"name": "Spring",
"value": {
"paramId": 4283,
"id": 3856
}
},
{
"name": "Aurora",
"value": {
"paramId": 4284,
"id": 3857
}
},
{
"name": "Rainbow",
"value": {
"paramId": 4285,
"id": 3858
}
},
{
"name": "Forest",
"value": {
"paramId": 4286,
"id": 3859
}
},
{
"name": "Ocean",
"value": {
"paramId": 4287,
"id": 3860
}
},
{
"name": "Snowing",
"value": {
"paramId": 4288,
"id": 3861
}
},
{
"name": "Spring Wind",
"value": {
"paramId": 4289,
"id": 3862
}
},
{
"name": "Cloudy",
"value": {
"paramId": 4290,
"id": 3863
}
},
{
"name": "Firefly",
"value": {
"paramId": 4291,
"id": 3864
}
},
{
"name": "Fire",
"value": {
"paramId": 4292,
"id": 3865
}
},
{
"name": "Waterfall",
"value": {
"paramId": 4293,
"id": 3866
}
},
{
"name": "Falling Petals",
"value": {
"paramId": 4294,
"id": 3867
}
},
{
"name": "Wave",
"value": {
"paramId": 4295,
"id": 3868
}
},
{
"name": "Raining",
"value": {
"paramId": 4296,
"id": 3869
}
},
{
"name": "Falling Leaves",
"value": {
"paramId": 4297,
"id": 3870
}
},
{
"name": "River",
"value": {
"paramId": 4298,
"id": 3871
}
},
{
"name": "Water Drop",
"value": {
"paramId": 4299,
"id": 3872
}
},
{
"name": "Morning",
"value": {
"paramId": 4300,
"id": 3873
}
},
{
"name": "Afternoon",
"value": {
"paramId": 4301,
"id": 3874
}
},
{
"name": "Leisure",
"value": {
"paramId": 4302,
"id": 3875
}
},
{
"name": "Refreshing",
"value": {
"paramId": 4303,
"id": 3876
}
},
{
"name": "Marshmallow",
"value": {
"paramId": 4304,
"id": 3877
}
},
{
"name": "Fish tank",
"value": {
"paramId": 4305,
"id": 3878
}
},
{
"name": "Cherry Blossom Festival",
"value": {
"paramId": 4306,
"id": 3879
}
},
{
"name": "Candy",
"value": {
"paramId": 4307,
"id": 3880
}
},
{
"name": "Strawberry",
"value": {
"paramId": 4308,
"id": 3881
}
},
{
"name": "Breathe",
"value": {
"paramId": 4309,
"id": 3882
}
},
{
"name": "Gradient",
"value": {
"paramId": 4310,
"id": 3883
}
},
{
"name": "Swing",
"value": {
"paramId": 4311,
"id": 3884
}
},
{
"name": "Train",
"value": {
"paramId": 4312,
"id": 3885
}
},
{
"name": "Candy Crush",
"value": {
"paramId": 4313,
"id": 3886
}
},
{
"name": "Gleam",
"value": {
"paramId": 4314,
"id": 3887
}
},
{
"name": "Drift",
"value": {
"paramId": 4315,
"id": 3888
}
},
{
"name": "Graffiti",
"value": {
"paramId": 4316,
"id": 3889
}
},
{
"name": "Blossom",
"value": {
"paramId": 4317,
"id": 3890
}
},
{
"name": "Love Heart",
"value": {
"paramId": 4318,
"id": 3891
}
},
{
"name": "Fireworks",
"value": {
"paramId": 4319,
"id": 3892
}
},
{
"name": "Cheerful",
"value": {
"paramId": 4320,
"id": 3893
}
},
{
"name": "Flow",
"value": {
"paramId": 4321,
"id": 3894
}
},
{
"name": "Healing",
"value": {
"paramId": 4322,
"id": 3895
}
},
{
"name": "Star",
"value": {
"paramId": 4323,
"id": 3896
}
},
{
"name": "Accompany",
"value": {
"paramId": 4324,
"id": 3897
}
},
{
"name": "Dreamland",
"value": {
"paramId": 4325,
"id": 3898
}
},
{
"name": "Night",
"value": {
"paramId": 4326,
"id": 3899
}
},
{
"name": "Night Light",
"value": {
"paramId": 4327,
"id": 3900
}
},
{
"name": "Venus",
"value": {
"paramId": 4328,
"id": 3901
}
},
{
"name": "Earth",
"value": {
"paramId": 4329,
"id": 3902
}
},
{
"name": "Mars",
"value": {
"paramId": 4330,
"id": 3903
}
},
{
"name": "Jupiter",
"value": {
"paramId": 4331,
"id": 3904
}
},
{
"name": "Uranus",
"value": {
"paramId": 4332,
"id": 3905
}
},
{
"name": "Milky Way",
"value": {
"paramId": 4333,
"id": 3906
}
}
]
}
}
]
}
}
response field
field data type
sku String Product model
device String device id
deviceName String The device name in Govee Home App.
capabilities Array device capabilities array
Capabilities Array

field data type
type String capbility type
instance String capability instance
parameters Object the struct definition of current parameter in this instance
Parameter Define Object

enum control value

field data type desc
dataType String define the data type of control value. e.g. ENUM, INTEGER, STRUCT
value Object show the options of control value
control light scene request
HTTP

POST /router/api/v1/device/control HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx

{
"requestId": "xxxx",
"payload": {
"sku": "H6057",
"device": "2F:56:C1:9A:7C:E8:5B:19",
"capability": {
"type": "devices.capabilities.dynamic_scene",
"instance": "lightScene",
"value": {
"paramId": 4280,
"id": 3853  
 }
}
}
}
Query Device's DIY Scene
Query Dynamic DIY Scene of the device through device and sku.

request example
HTTP

POST /router/api/v1/device/diy-scenes HTTP/1.1
Host: https://openapi.api.govee.com
Content-Type: application/json
Govee-API-Key: xxxx

{
"requestId": "uuid",
"payload": {
"sku": "H618E",
"device": "8C:2E:9C:04:A0:03:82:D1"
}
}
response success example
JSON

{
"requestId": "uuid",
"msg": "success",
"code": 200,
"payload": {
"sku": "H618E",
"device": "8C:2E:9C:04:A0:03:82:D1",
"capabilities": [
{
"type": "devices.capabilities.diy_color_setting",
"instance": "diyScene",
"parameters": {
"dataType": "ENUM",
"options": [
{
"name": "Xmas lights 2",
"value": 8216931
},
{
"name": "Xmas",
"value": 8216930
},
{
"name": "White lights non holid",
"value": 8216929
},
{
"name": "test",
"value": 8216643
}
]
}
}
]
}
}
Friendly Reminder
if the request response 429, means request limits happens, 10000/Account/Day

Updated 19 minutes ago

Get Device State
Subscribe Device Event
Did this page help you?
Table of Contents
Query Device's Light Scene
Query Device's DIY Scene
Jump to Content
Govee Development Platform
Log In
v1.0
Home
Guides
API Reference
Changelog

Search
⌘K
JUMP TO
⌘/
Awesome New API
Apply Govee-API-Key
API Reference

Get You Devices
Control You Device
Get Device State
Get Dynamic Scene
Subscribe Device Event
Powered by

Subscribe Device Event
If your device's capabilities include 'devices.capabilities.event', then you can listen for the event in the following ways.

Connection parameters:

Host: mqtts://mqtt.openapi.govee.com

Port: 8883

Username: [Your Api-Key]

Password: [Your Api-Key]

Topic: GA/ [Your Api-Key]

For example:

js

const mqtt = require('mqtt')
const apiKey = [Your Api-Key];  
const emqx_url = 'mqtt.openapi.govee.com';

const options = {  
 clean: true,  
 username: apiKey,  
 password: apiKey,  
}

const connectUrl = 'mqtts://' + emqx_url  
const client = mqtt.connect(connectUrl, options)

client.on('connect', () => {  
 console.log('Connected to the broker.')  
 client.subscribe(apiKey, (err) => {  
 if (!err) {  
 console.log('Subscribed to topic apiKey')  
 }  
 })  
})

client.on('message', (topic, message) => {  
 console.log(`Received message ${message} from topic ${topic}`)  
})
If your ice machine(H7172) is out of water, you will receive the following message.
json

{
"sku": "H7172",
"device": "41:DA:D4:AD:FC:46:00:64",
"deviceName": "H7172",
"capabilities":[
{
"type": "devices.capabilities.event",
"instance": "lackWaterEvent",
"state": [
{
"name": "lack",
"value": 1,
"message": "Lack of Water"
}
]
}
]
}
Presence Sensor(H5127): You will receive notifications of Presence
json

{
"sku": "H5127",
"device": "06:30:60:74:F4:45:B9:DA",
"deviceName": "Presence Sensor",
"capabilities": [
{
"type": "devices.capabilities.event",
"instance": "bodyAppearedEvent",
"state": [
{
"name": "Presence",
"value": 1
}
]
}
]
}
Presence Sensor(H5127): You will receive notifications of Absence
json

{
"sku": "H5127",
"device": "06:30:60:74:F4:45:B9:DA",
"deviceName": "Presence Sensor",
"capabilities": [
{
"type": "devices.capabilities.event",
"instance": "bodyAppearedEvent",
"state": [
{
"name": "Absence",
"value": 2
}
]
}
]
}
Dehumidifier(H7151)：Full water notification.
json

{
"sku": "H7151",
"device": "06:30:60:74:F4:45:B9:DA",
"deviceName": "Dehumidifier",
"capabilities":[
{
"type": "devices.capabilities.event",
"instance": "lackWaterEvent",
"state": [
{
"name": "lack",
"value": 1,
"message": "Lack of Water"
}
]
}
]
}
Updated 2 days ago

Get Dynamic Scene
Did this page help you?

govee url: aqm3wd1qlc3dy-ats.iot.us-east-1.amazonaws.com
