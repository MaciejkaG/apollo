# Apollo
Apollo is an advanced AI voice assistant with a beautiful UI and various integrations.

# Dependencies
## SoX
To use Apollo's wake word functionality ("Apollo"), you need to install SoX using one of the following:
- [SourceForge](https://sourceforge.net/projects/sox/)
- Mac - [Homebrew](https://formulae.brew.sh/formula/sox) - ``brew install sox``
- Debian - [APT](https://packages.ubuntu.com/oracular/sox) - ``sudo apt install sox``

**Remember to add SoX to path after installing**, if your package manager doesn't do that already.

## Google Cloud Credentials
You need to have your Google Cloud credentials set up to use the Speech-to-Text. Find out more on Application Default Credentials [here](https://cloud.google.com/docs/authentication/application-default-credentials).

## FFmpeg
You need to have FFmpeg installed and added to path to use the Text-to-Speech functionality. You can install FFmpeg using one of the following:
- Windows - [FFmpeg's website](https://www.ffmpeg.org/)
- Mac - [Homebrew](https://formulae.brew.sh/formula/ffmpeg) - ``brew install ffmpeg``
- Debian - [APT](https://packages.ubuntu.com/oracular/ffmpeg) - ``sudo apt install FFmpeg``