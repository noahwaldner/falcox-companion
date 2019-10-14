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
let savePath;
let backupContent = [];
let mainWindow
let parser
let dumpParser

const initializeSerialDevice = () => {
    //initialize Window
    mainWindow.send(CATCH_LOG, "init")
    //list all serial devices
    SerialPort.list((err, ports) => {
        mainWindow.send(CATCH_LOG, ports)
        ports.forEach(function (port) {
            DevicePort = port.comName.toString();
        })
        serialDevice = new SerialPort(DevicePort);
        parser = serialDevice.pipe(new Delimiter({ delimiter: '[?25l' }))
        dumpParser = serialDevice.pipe(new Readline({ delimiter: '\r\n' }))
        serialDevice.on("open", (err) => {
            mainWindow.send(CATCH_LOG, DevicePort)
            mainWindow.send(CATCH_LOG, "port opened")
            console.log("opened");
            if (!err) {
                serialDevice.write("osdon 1\r\n")
                parser.on('data', line => mainWindow.send(CATCH_MESSAGE, String.fromCharCode.apply(null, line)));
                dumpParser.on('data', line => {
                    if (line.includes("SET")) {
                        backupContent.push(line)
                    } else if (line.includes("Dump Complete")) {
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


usb.on('detach', (device) => {
    mainWindow.send(CATCH_CONNECTION_STATE, 1)
    SerialPort.list((err, ports) => {
        mainWindow.send(1, ports)
    })
});

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



ipcMain.on(CATCH_ON_MAIN, (event, arg) => {
    if (arg === "backup") {
        serialDevice.write("osdoff\r\n")
        serialDevice.write("dump\r\n")
    } else if (arg === "restore") {
        serialDevice.write("osdoff\r\n")
        restoreBackup()
    } else if (arg === "dfu") {
        serialDevice.write("dfu\r\n")
    }
})

process.on('uncaughtException', function (error) {
    // Handle the error
});