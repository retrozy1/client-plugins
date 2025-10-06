import Recorder from './recorder';

let recorder: Recorder;

api.hotkeys.addConfigurableHotkey({
    category: "Input Recorder",
    title: "Start Recording",
    default: {
        key: "KeyR",
        alt: true
    }
}, () => {
    if(!recorder) return;

    if(recorder.playing) {
        api.notification.open({ message: "Cannot record while playing", type: "error" })
        return;
    }
    
    if(recorder.recording) {
        api.hotkeys.releaseAll();
    }

    recorder.toggleRecording();
});

api.hotkeys.addConfigurableHotkey({
    category: "Input Recorder",
    title: "Play Back Recording",
    default: {
        key: "KeyB",
        alt: true
    }
}, () => {
    if(!recorder) return;

    if(recorder.recording) {
        api.notification.open({ message: "Cannot playback while recording", type: "error" })
        return;
    }
    
    if(recorder.playing) {
        recorder.stopPlayback();
        api.notification.open({ message: "Playback canceled" })
    } else {
        let input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async () => {
            api.hotkeys.releaseAll();
            let file = input.files?.[0];
            if(!file) return;
            
            let json = await file.text();
            let data = JSON.parse(json);
            api.notification.open({ message: "Starting Playback" });
    
            recorder.playback(data);
        }

        input.click();
    }
});

api.net.onLoad(() => {
    recorder = new Recorder(api.stores.phaser.scene.worldManager.physics);
});

export function getRecorder() {
    return recorder;
}