const { dialog } = require('electron')
const fs = require('fs');

let savePath;

module.exports.saveBackup = (serialDevice, backupParams, sendDeviceStatus) => {
    let openDialogOptions = {
        defaultPath: "mySetting.txt",
        properties: ['createDirectory',]
    }
    savePath = dialog.showSaveDialog(null, openDialogOptions).then((path) => {
        try {
            if (!path.canceled) {
                fs.writeFileSync(path.filePath, JSON.stringify(backupParams), 'utf-8');
                sendDeviceStatus(3)
                let messagebox = dialog.showMessageBox(null, { message: "Settings saved successfully!" })
            }
            serialDevice.write("osdon 1\r\n")
        }
        catch {
            sendDeviceStatus(0)
            let messagebox = dialog.showMessageBox(null, { message: "Error occured while saving file!" })
            serialDevice.write("osdon 1\r\n")
        };
    });
};




module.exports.restoreBackup = (serialDevice, backupParams, sendDeviceStatus, sendMessage) => {
    let restoreDialogOptions = {
        filters: [
            { name: 'Falco X Backups', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    }
    dialog.showOpenDialog(null, restoreDialogOptions, (filePaths) => {
        try {
            fs.readFile(filePaths[0], 'utf8', function (err, contents) {
                try {
                    let restoreParams = JSON.parse(contents);
                    console.log("restoring");
                    restoreParams.forEach((element, key, arr) => {
                        setTimeout(() => {
                            sendMessage(element + " \r\n");
                            serialDevice.write(element + " \r\n")
                            if (key == arr.length - 1) {
                                serialDevice.write("\r\n")
                                serialDevice.write("save\r\n")
                                setTimeout(() => {
                                    serialDevice.write("osdon 1\r\n");
                                    sendDeviceStatus(3)
                                    let messagebox = dialog.showMessageBox(null, { message: "Settings restored successfully!" })
                                }, 4000);
                            }
                        }, key * 20);
                    });
                } catch (error) {
                    throw "Invalid File"
                }
            });
        } catch {
            sendDeviceStatus(0);
            let messagebox = dialog.showMessageBox(null, { message: "Error occured while loading file!" })
            serialDevice.write("osdon 1\r\n")
        };
    })

};