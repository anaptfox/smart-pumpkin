const Cylon = require('cylon');
const Device = require('losant-mqtt').Device;
const Say = require('say');

var currentlySpeaking = false;

// Construct device.
var device = new Device({
    id: 'DEVICE_ID',
    key: 'DEVICE_KEY',
    secret: 'DEVICE_SECRET'
});

// Connect to Losant.
device.connect();

Cylon.robot({
    connections: {
        edison: {
            adaptor: 'intel-iot'
        }
    },

    devices: {
        motion: {
            driver: 'direct-pin',
            pin: 2
        }
    },

    work: function(my) {
        // Read motion every ten seconds
        every((10).second(), function() {
            my.motion.digitalRead(function(err, movement) {
                // Do I detect movement and am I not currently speaking
                movement && !currentlySpeaking ? movement() : still()
            })
        });

        // Listen for commands from Losant
        device.on('command', function(command) {
            console.log('Command received.');
            console.log(command.name);
            console.log(command.payload);

            if (command.name == 'speak') {
                speak(my, command.payload.text)
            }
        });
    }
}).start();

/**
 * Speak intro phrase and
 * Send motion detection to Losant
 */
function movement() {
    console.log('Movement Detected')
    device.sendState({
        motion: true
    });
    var intro = [
        'I see you. Listen to my funny joke',
        'I see you. Come eat free food. I also have a joke',
        'Listen to my joke',
        'I am a smart pumpkin with a joke'
    ]
    var choice = intro[Math.floor(Math.random() * intro.length)];
    speak([choice]);
}

/**
 * Send still detection to Losant
 */
function still() {
    console.log('Still Detected')
    device.sendState({
        motion: false
    });
}

/**
 * Speak text using Festival
 * @param  {array} text Array of sentences to speak
 */
function speak(text) {
    if (!currentlySpeaking) {
        console.log('Speaking')
        currentlySpeaking = true

        var calledOnce = false
        Say.speak(text[0], null, null, function() {
            // Say.js does not fire the callback at the right time. It calls it
            // twice. So, we have to check and do nothing on the first call
            if (calledOnce == true) {
                text[1] ? say.speak(text[1]) : null
                currentlySpeaking = false
                calledOnce = false
            } else {
                calledOnce = true
            }
        })

    }
}
