import bencode from "bencode";
import axios from "axios";
import crypto from "crypto";
import fs from "fs";

const generateInfoHash = (metainfo) => {
    const info = bencode.encode(metainfo.info);
    return crypto.createHash("sha1").update(info).digest();
};

const parsePeers = (peersBuffer) => {
    const peers = [];
    for (let i = 0; i < peersBuffer.length; i += 6) {
        const ip = `${peersBuffer[i]}.${peersBuffer[i + 1]}.${peersBuffer[i + 2]}.${peersBuffer[i + 3]}`;
        const port = (peersBuffer[i + 4] << 8) + peersBuffer[i + 5];
        peers.push({ ip, port });
    }
    return peers;
};

export const initializeTrackerProtocol = async (torrentFilePath) => {
    try {
        console.log("Tracker Protocol - 20% (initialization phase): Starting...");
        const torrentData = fs.readFileSync(torrentFilePath);
        const metainfo = bencode.decode(torrentData);
        console.log("Metainfo parsed successfully:", metainfo.announce.toString());

        const infoHash = generateInfoHash(metainfo);
        const peerId = crypto.randomBytes(20).toString("hex");
        const params = {
            info_hash: infoHash.toString("binary"),
            peer_id: peerId,
            port: 6881,
            uploaded: 0,
            downloaded: 0,
            left: metainfo.info.length || 0,
            compact: 1,
        };

        const trackerUrl = metainfo.announce.toString();
        const response = await axios.get(trackerUrl, {
            params,
            responseType: "arraybuffer",
        });

        const trackerResponse = bencode.decode(Buffer.from(response.data));
        if (trackerResponse.failure) {
            throw new Error(`Tracker error: ${trackerResponse["failure reason"].toString()}`);
        }

        const peersBuffer = trackerResponse.peers;
        const peers = parsePeers(peersBuffer);
        console.log("Peers parsed successfully:", peers);

        return peers;
    } catch (error) {
        console.error("Error in Tracker Protocol:", error.message);
        throw error;
    }
};