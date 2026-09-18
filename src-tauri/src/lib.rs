use midir::MidiOutput;
use serde::Serialize;

#[derive(Serialize)]
struct MidiPortSummary {
  id: String,
  name: String,
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
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
    .invoke_handler(tauri::generate_handler![list_midi_outputs])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
