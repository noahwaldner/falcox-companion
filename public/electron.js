// Modules to control application life and create native browser window
const { saveBackup, restoreBackup } = require('./services/backup.js');
const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron')

const startUrl = process.env.ELECTRON_START_URL || `file://${__dirname}/index.html`;
const SerialPort = require('serialport');
const Delimiter = require('@serialport/parser-delimiter')
const Readline = require('@serialport/parser-readline')
const usb = require('usb')
const CATCH_CONNECTION_STATE = "catchConnectionState"
const CATCH_MESSAGE = "catchMessage"
const CATCH_LOG = "catchLog"
const CATCH_ON_MAIN = "catch_on_main"
let serialDevice;
let DevicePort;
let backupContent = [];
let mainWindow
let parser
let dumpParser

const initializeSerialDevice = () => {
    //list all serial devices
    SerialPort.list((err, ports) => {
        //logging
        mainWindow.send(CATCH_LOG, ports)
        ports.forEach(function (port) {
            DevicePort = port.comName.toString();
        })
        //open serial port
        serialDevice = new SerialPort(DevicePort);
        //initialize parser for osd lines
        parser = serialDevice.pipe(new Delimiter({ delimiter: '[?25l' }))
        //initalize parser for sumps
        dumpParser = serialDevice.pipe(new Readline({ delimiter: '\r\n' }))
        //detect when serial port is opened
        serialDevice.on("open", (err) => {
            mainWindow.send(CATCH_LOG, DevicePort)
            mainWindow.send(CATCH_LOG, "port opened")
            if (!err) {
                //activate osd readout
                serialDevice.write("osdon 1\r\n")
                //every time a new line is received, send it to the renderer
                parser.on('data', line => mainWindow.send(CATCH_MESSAGE, String.fromCharCode.apply(null, line)));
                //wehen a new line from a dump is received, save it to an array wich will be saved to the backup file
                dumpParser.on('data', line => {
                    //check if it is backup line
                    if (line.includes("SET")) {
                        backupContent.push(line)
                    } else if (line.includes("Dump Complete")) {
                        //save backup to file
                        saveBackup(serialDevice, backupContent, ((status) => { mainWindow.send(CATCH_CONNECTION_STATE, status); }), ((message) => { mainWindow.send(CATCH_MESSAGE, message); }));
                    }
                });
            } else {
                mainWindow.send(CATCH_CONNECTION_STATE, 0)
            }
        })
    })
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        icon: __dirname + '../assets/icon.png',
        resizable: false
    })
    // and load the index.html of the app.
    mainWindow.loadURL(startUrl)
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
    setTimeout(() => {
        initializeSerialDevice()
    }, 2000);
    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        serialDevice.close()
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow()
})
//detect when usb device is detached
usb.on('detach', (device) => {
    mainWindow.send(CATCH_CONNECTION_STATE, 1)
    SerialPort.list((err, ports) => {
        mainWindow.send(1, ports)
    })
});

//detect when usb device is attatched
usb.on('attach', (device) => {
    do {
        if (mainWindow) {
            mainWindow.send(CATCH_CONNECTION_STATE, 2)
            setTimeout(() => {
                initializeSerialDevice()
            }, 1000);
        }
    } while (!mainWindow);
});

//catch events coming from the renderer
ipcMain.on(CATCH_ON_MAIN, (event, arg) => {
    if (arg === "backup") {
        //deactiveate osd printout
        serialDevice.write("osdoff\r\n")
        //dump all variables
        serialDevice.write("dump\r\n")
    } else if (arg === "restore") {
        //deactiveate osd printout
        serialDevice.write("osdoff\r\n")
        //restore backup
        restoreBackup()
    } else if (arg === "dfu") {
        serialDevice.write("dfu\r\n")
    }
})

process.on('uncaughtException', function (error) {
    // Handle the error
});