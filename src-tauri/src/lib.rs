use midir::{Ignore, MidiInput, MidiInputConnection, MidiOutput, MidiOutputConnection};
use serde::Serialize;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

#[derive(Default)]
struct MidiState {
    output: Mutex<Option<MidiOutputConnection>>,
    input: Mutex<Option<MidiInputConnection<()>>>,
}

#[derive(Serialize)]
struct MidiPortSummary {
    id: String,
    name: String,
}

#[derive(Clone, Serialize)]
struct MidiInputMessage {
    timestamp: u64,
    data: Vec<u8>,
}

#[tauri::command]
fn list_midi_inputs() -> Result<Vec<MidiPortSummary>, String> {
    let midi_input = MidiInput::new("GHOST MIDI Input").map_err(|error| error.to_string())?;

    midi_input
        .ports()
        .iter()
        .enumerate()
        .map(|(index, port)| {
            let name = midi_input
                .port_name(port)
                .unwrap_or_else(|_| "MIDI Input".to_string());

            Ok(MidiPortSummary {
                id: index.to_string(),
                name,
            })
        })
        .collect()
}

#[tauri::command]
fn list_midi_outputs() -> Result<Vec<MidiPortSummary>, String> {
    let midi_output = MidiOutput::new("GHOST MIDI Output").map_err(|error| error.to_string())?;

    midi_output
        .ports()
        .iter()
        .enumerate()
        .map(|(index, port)| {
            let name = midi_output
                .port_name(port)
                .unwrap_or_else(|_| "MIDI Output".to_string());

            Ok(MidiPortSummary {
                id: index.to_string(),
                name,
            })
        })
        .collect()
}

#[tauri::command]
fn connect_midi_input(
    input_id: String,
    app: AppHandle,
    state: tauri::State<MidiState>,
) -> Result<(), String> {
    let input_index = input_id
        .parse::<usize>()
        .map_err(|_| "Invalid MIDI input id.".to_string())?;
    let mut midi_input = MidiInput::new("GHOST MIDI Input").map_err(|error| error.to_string())?;
    midi_input.ignore(Ignore::None);
    let ports = midi_input.ports();
    let port = ports
        .get(input_index)
        .ok_or_else(|| "MIDI input was not found.".to_string())?;
    let connection = midi_input
        .connect(
            port,
            "GHOST MIDI Input Connection",
            move |timestamp, message, _| {
                let _ = app.emit(
                    "midi-input-message",
                    MidiInputMessage {
                        timestamp,
                        data: message.to_vec(),
                    },
                );
            },
            (),
        )
        .map_err(|error| error.to_string())?;

    *state
        .input
        .lock()
        .map_err(|_| "MIDI input connection is unavailable.".to_string())? = Some(connection);

    Ok(())
}

#[tauri::command]
fn disconnect_midi_input(state: tauri::State<MidiState>) -> Result<(), String> {
    *state
        .input
        .lock()
        .map_err(|_| "MIDI input connection is unavailable.".to_string())? = None;

    Ok(())
}

#[tauri::command]
fn connect_midi_output(output_id: String, state: tauri::State<MidiState>) -> Result<(), String> {
    let output_index = output_id
        .parse::<usize>()
        .map_err(|_| "Invalid MIDI output id.".to_string())?;
    let midi_output = MidiOutput::new("GHOST MIDI Output").map_err(|error| error.to_string())?;
    let ports = midi_output.ports();
    let port = ports
        .get(output_index)
        .ok_or_else(|| "MIDI output was not found.".to_string())?;
    let connection = midi_output
        .connect(port, "GHOST MIDI Connection")
        .map_err(|error| error.to_string())?;

    *state
        .output
        .lock()
        .map_err(|_| "MIDI output connection is unavailable.".to_string())? = Some(connection);

    Ok(())
}

#[tauri::command]
fn disconnect_midi_output(state: tauri::State<MidiState>) -> Result<(), String> {
    *state
        .output
        .lock()
        .map_err(|_| "MIDI output connection is unavailable.".to_string())? = None;

    Ok(())
}

#[tauri::command]
fn send_midi_note(
    channel: u8,
    pitch: u8,
    velocity: u8,
    state: tauri::State<MidiState>,
) -> Result<(), String> {
    send_midi_message(
        &state,
        &[0x90 + clamp_midi_channel(channel), pitch, velocity],
    )
}

#[tauri::command]
fn send_midi_note_off(
    channel: u8,
    pitch: u8,
    state: tauri::State<MidiState>,
) -> Result<(), String> {
    send_midi_message(&state, &[0x80 + clamp_midi_channel(channel), pitch, 0])
}

#[tauri::command]
fn send_midi_cc(
    channel: u8,
    controller: u8,
    value: u8,
    state: tauri::State<MidiState>,
) -> Result<(), String> {
    send_midi_message(
        &state,
        &[0xb0 + clamp_midi_channel(channel), controller, value],
    )
}

#[tauri::command]
fn send_midi_clock(state: tauri::State<MidiState>) -> Result<(), String> {
    send_midi_message(&state, &[0xf8])
}

fn send_midi_message(state: &tauri::State<MidiState>, message: &[u8]) -> Result<(), String> {
    let mut output = state
        .output
        .lock()
        .map_err(|_| "MIDI output connection is unavailable.".to_string())?;
    let connection = output
        .as_mut()
        .ok_or_else(|| "No MIDI output is connected.".to_string())?;

    connection.send(message).map_err(|error| error.to_string())
}

fn clamp_midi_channel(channel: u8) -> u8 {
    channel.saturating_sub(1).min(15)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(MidiState::default())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_midi_inputs,
            list_midi_outputs,
            connect_midi_input,
            disconnect_midi_input,
            connect_midi_output,
            disconnect_midi_output,
            send_midi_note,
            send_midi_note_off,
            send_midi_cc,
            send_midi_clock
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
