import STM32DFU from './protocols/stm32usbdfu'
import STM32 from './protocols/stm32'
let self = {};


function flashFirmware(firmware) {
    let port = null;
    var options = {
        erase_chip: true,
        reboot_baud: 115200,
        no_reboot: true
    };



    STM32.connect(port, options.baud, firmware, options);
}

function process_hex(data, summary) {
    self.intel_hex = data;

    parse_hex(self.intel_hex, function (data) {
        self.parsed_hex = data;
    });
}

function parse_hex(str, callback) {
    // parsing hex in different thread
    var worker = new Worker('./js/workers/hex_parser.js');

    // "callback"
    worker.onmessage = function (event) {
        callback(event.data);
    };

    // send data/string over for processing
    worker.postMessage(str);
}