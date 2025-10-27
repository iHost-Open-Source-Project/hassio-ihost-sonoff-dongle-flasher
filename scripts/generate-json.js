import { readdir, writeFile } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Naming convention: [Product Model]_[Chip Model]_[Firmware Type]_[Firmware Tag]_[Version]_[Baud Rate].bin/gbl/hex
 * Examples:
 * donglee_mg21_zigbee_stable_6.10.3_115200.gbl
 * donglee_mg21_openthread_stable_2.4.4_460800.gbl
 * donglee_mg21_multipan_stable_7.4.3_115200.gbl
 * donglee_mg21_zigbeerouter_stable_7.4.3_115200.gbl
 * donglep_cc2652p_zigbee_stable_20240703_115200.hex
 * donglep_cc2652p_zigbeerouter_stable_20240703_115200.hex
 */

// Manually emulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Output file name
const OUTPUT_JSON_NAME = 'FIRMWARE_LIST.json';

// Path to the folder containing this script
const folderPath = join(__dirname, '..', 'firmware-build'); // __dirname is the Node.js global for the current script directory

// Read directory contents
readdir(folderPath, (err, files) => {
    if (err) {
        throw new Error('Failed to read firmware folder:', err);
        return;
    }

    // Filter out .DS_Store and the generated JSON file
    const filenameList = files.filter((file) => !['.DS_Store', OUTPUT_JSON_NAME].includes(file));

    const fileObjList = parseFirmwareList(filenameList);

    // Build the JSON payload containing the filenames
    const jsonData = {
        firmwareList: fileObjList,
    };

    // Write the JSON data to disk
    writeFile(join(folderPath, OUTPUT_JSON_NAME), JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
            throw new Error('Failed to write JSON file:', err);
        } else {
            console.log('Generated JSON file:', OUTPUT_JSON_NAME);
        }
    });
});

// Extract firmware metadata
function parseFirmwareList(firmwareNameList) {
    return firmwareNameList.flatMap((name) => {
        // Regex used to parse the filename
        const match = name.match(/^([a-zA-Z0-9]+)_([a-zA-Z0-9]+)?(?:_([a-zA-Z0-9]+))?_([a-zA-Z0-9]+)_([0-9.]+)_([0-9]+)(?:_([0-9.]+))?\.(bin|gbl|hex)$/);

        if (match) {
            const [, dongleType, chipModel, firmwareType, firmwareDesc, version, baudRate] = match;

            return {
                name,
                dongleType: mapDongleType(dongleType),
                chipModel,
                firmwareType: mapFirmwareType(firmwareType, chipModel), // Map firmware type to a friendly label
                firmwareDesc,
                version,
                baudRate,
            };
        } else {
            console.log('Firmware info did not match pattern:', name);
        }

        // Return an empty entry when parsing fails
        return [];
    });
}

// Map firmware type to a display name
function mapFirmwareType(type, chipModel) {
    const mapping = {
        zigbee: 'Zigbee',
        zigbeerouter: 'Zigbee Router',
        openthread: 'OpenThread',
        multipan: 'MultiPAN',
    };

    const mappingRes = mapping[type];
    if (mappingRes) return mappingRes;
    if (chipModel === 'esp32') return 'Official';

    return 'unknown';
}

// Map product type to a display name
function mapDongleType(type) {
    const mapping = {
        ihost: 'iHost',
        donglee: 'ZBDongle-E',
        donglep: 'ZBDongle-P',
        donglem: 'Dongle-M',
        donglelmg21: 'Dongle-LMG21',
        donglepmg24: 'Dongle-PMG24',
    };

    return mapping[type] || 'unknown';
}

