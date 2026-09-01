# Brane

Brane is a desktop app for chatting with large language models locally on your
computer. Your prompts, responses, chat history, and model files stay on your
device. Brane does not require a backend service to run your chats.

## Early development

Brane is still early in development. Many features are not available yet, and
there is more work to do on performance, resource use, and general polish. The
app can be used as it is today, but bugs and unexpected behavior can occur.

Please report problems to the developer. Include what you were doing, what you
expected to happen, what happened instead, and your operating system. Brane keeps
local diagnostic logs to help investigate errors. You can open the logs folder
from **Settings > General > Logs** and share the relevant log files with your report.
Review logs before sharing them and remove any information you consider sensitive.

## What you need

Brane does not include an AI model. Before chatting, you need to obtain a model
in **GGUF format**. Other model formats are not supported.

[Hugging Face](https://huggingface.co/models?library=gguf) is the recommended
place to find GGUF models. Model creators commonly offer several quantizations
of the same model. Quantization affects file size, memory use, speed, and output
quality, so read the model card and the creator's instructions before choosing
a file.

You are responsible for checking that your computer has enough memory and
appropriate hardware to run your chosen model. A larger model or context can
require considerably more RAM or unified memory than the model's file size. If
a model cannot be loaded, try a smaller model or a more compressed
quantization.

Brane does not currently estimate model compatibility for your system. A system
compatibility check and direct model downloads from within the app are planned
for a future release.

## Add a model

1. Download a `.gguf` model file from a source you trust.
2. Place the file in the `~/.brane/models` folder.
3. Open Brane and select **Models**.
4. Choose the model you want to load.
5. Start a new chat and send a message.

Brane watches the models folder while it is running, so newly added files should
appear automatically. If the folder does not exist yet, create it or launch
Brane once and let the app create it.

Each chat is associated with the model used to create it. If that model is
removed, the chat remains readable, but you cannot continue it until the same
model is available again. Replacing a model file with a different file under
the same name is also detected.

## Features

- Local, streamed conversations with GGUF models
- Persistent and searchable chat history
- Rename and delete conversations
- Stop generation at any time
- Display of supported model reasoning segments
- Markdown, code highlighting, tables, and math in responses
- Light, dark, and system themes
- Adjustable message font size
- Customizable keyboard shortcuts and send behavior
- English, German, Croatian, and Serbian interfaces
- Local diagnostic logs that you can open or delete from settings

## Privacy and model responsibility

Brane runs inference and stores app data locally. It does not provide, host, or
distribute language models. Review the source, license, usage restrictions, and
privacy implications of every model you obtain.

By using Brane, you agree to the [Terms of Use](TERMS_OF_USE.md).

## License

Brane is released under the [MIT License](LICENSE). Model files are separate
works and remain subject to their own licenses and terms.
