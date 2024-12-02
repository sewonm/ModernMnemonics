// MnemonicGenerator class to handle OpenAI API interactions
class MnemonicGenerator {
    constructor() {
        this.savedMnemonics = this.loadSavedMnemonics();
        this.currentMode = 'brainrot';
        this.currentVoice = 'a';
        this.currentVideo = '';
        this.currentSong = 'pop';
        this.currentCharacter = 'friendly';
    }

    async generateMnemonic(word) {
        let prompt = this.getPromptForMode(word);
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: [
                    {
                        role: "system",
                        content: this.getSystemPrompt()
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    getSystemPrompt() {
        switch(this.currentMode) {
            case 'brainrot':
                return "You are a creative assistant that creates memorable, internet-culture inspired mnemonics.";
            case 'song':
                return `You are a musical composer creating mnemonics in the style of ${this.currentSong} music.`;
            case 'chatbot':
                return `You are a ${this.currentCharacter} character helping people remember things through conversation.`;
            default:
                return "You are a helpful assistant that creates memorable mnemonics.";
        }
    }

    getPromptForMode(word) {
        switch(this.currentMode) {
            case 'brainrot':
                return `Create a memorable, chaotic and internet-culture inspired mnemonic for the word: ${word}. Make it trendy and engaging.`;
            case 'song':
                return `Create a catchy ${this.currentSong}-style song or jingle for remembering the word: ${word}`;
            case 'chatbot':
                return `As a ${this.currentCharacter}, create a dialogue that helps remember the word: ${word}`;
            default:
                return `Create a memorable mnemonic for the word: ${word}`;
        }
    }

    loadSavedMnemonics() {
        const saved = localStorage.getItem('savedMnemonics');
        return saved ? JSON.parse(saved) : [];
    }

    saveMnemonic(word, mnemonic) {
        const mnemonicData = {
            word,
            mnemonic,
            date: new Date().toISOString(),
            mode: this.currentMode
        };

        // Add mode-specific data
        switch(this.currentMode) {
            case 'brainrot':
                mnemonicData.voice = this.currentVoice;
                mnemonicData.video = this.currentVideo;
                break;
            case 'song':
                mnemonicData.songStyle = this.currentSong;
                break;
            case 'chatbot':
                mnemonicData.character = this.currentCharacter;
                break;
        }

        this.savedMnemonics.push(mnemonicData);
        localStorage.setItem('savedMnemonics', JSON.stringify(this.savedMnemonics));
    }

    getSavedMnemonics() {
        return this.savedMnemonics;
    }
}

// DOM interaction code
document.addEventListener('DOMContentLoaded', () => {
    const generator = new MnemonicGenerator();
    const wordInput = document.getElementById('wordInput');
    const generateBtn = document.getElementById('generateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const resultDiv = document.getElementById('result');
    const loadingSpinner = document.getElementById('loading');
    const savedList = document.getElementById('savedList');
    
    let currentMnemonic = '';

    function showModeOptions(mode) {
        // Hide all mode options first
        document.querySelectorAll('.mode-options').forEach(option => {
            option.style.display = 'none';
        });
        
        // Show the options for the selected mode
        const optionsToShow = document.getElementById(`${mode}Options`);
        if (optionsToShow) {
            optionsToShow.style.display = 'block';
        }
    }

    // Mode selection
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update button states
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update current mode and show relevant options
            const mode = btn.dataset.mode;
            generator.currentMode = mode;
            showModeOptions(mode);
        });
    });

    // Set initial active mode and show its options
    const initialMode = 'brainrot';
    document.querySelector(`[data-mode="${initialMode}"]`).classList.add('active');
    showModeOptions(initialMode);

    // Brainrot mode options
    const voiceInputs = document.querySelectorAll('input[name="voice"]');
    voiceInputs.forEach(input => {
        input.addEventListener('change', () => {
            generator.currentVoice = input.value;
        });
    });

    const videoSelect = document.getElementById('backgroundVideo');
    if (videoSelect) {
        videoSelect.addEventListener('change', () => {
            generator.currentVideo = videoSelect.value;
        });
    }

    // Song mode options
    const songSelect = document.getElementById('songStyle');
    if (songSelect) {
        songSelect.addEventListener('change', () => {
            generator.currentSong = songSelect.value;
        });
    }

    // Chatbot mode options
    const characterSelect = document.getElementById('character');
    if (characterSelect) {
        characterSelect.addEventListener('change', () => {
            generator.currentCharacter = characterSelect.value;
        });
    }

    // Update saved mnemonics display
    function updateSavedList() {
        const mnemonics = generator.getSavedMnemonics();
        savedList.innerHTML = mnemonics.map(item => {
            let details = `Mode: ${item.mode}`;
            
            // Add mode-specific details
            switch(item.mode) {
                case 'brainrot':
                    details += ` | Voice: ${item.voice}`;
                    if (item.video) details += ` | Video: ${item.video}`;
                    break;
                case 'song':
                    details += ` | Style: ${item.songStyle}`;
                    break;
                case 'chatbot':
                    details += ` | Character: ${item.character}`;
                    break;
            }

            return `
                <div class="saved-item">
                    <h3>${item.word}</h3>
                    <p>${item.mnemonic}</p>
                    <small>
                        Created: ${new Date(item.date).toLocaleDateString()} | 
                        ${details}
                    </small>
                </div>
            `;
        }).join('');
    }

    generateBtn.addEventListener('click', async () => {
        const word = wordInput.value.trim();
        if (!word) {
            alert('Please enter a word');
            return;
        }

        try {
            loadingSpinner.style.display = 'block';
            generateBtn.disabled = true;
            
            currentMnemonic = await generator.generateMnemonic(word);
            resultDiv.innerHTML = `<p class="mnemonic">${currentMnemonic}</p>`;
            saveBtn.style.display = 'block';
        } catch (error) {
            resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        } finally {
            loadingSpinner.style.display = 'none';
            generateBtn.disabled = false;
        }
    });

    saveBtn.addEventListener('click', () => {
        const word = wordInput.value.trim();
        
        try {
            generator.saveMnemonic(word, currentMnemonic);
            updateSavedList();
            alert('Mnemonic saved successfully!');
        } catch (error) {
            alert(`Error saving mnemonic: ${error.message}`);
        }
    });

    // Initialize saved list
    updateSavedList();
});
