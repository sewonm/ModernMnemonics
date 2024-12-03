// MnemonicGenerator class to handle OpenAI API interactions
class MnemonicGenerator {
    constructor() {
        this.savedMnemonics = this.loadSavedMnemonics();
        this.currentMode = 'brainrot';
        this.currentVoice = 'a';
        this.currentVideo = '';
        this.currentSong = 'pop';  // Default song style
        this.currentCharacter = 'naruto';  // Set default character to naruto
        this.chatHistory = [];
        this.apiKey = localStorage.getItem('openai_api_key') || '';
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('openai_api_key', key);
    }

    async generateMnemonic(word) {
        switch (this.currentMode) {
            case 'song':
                return await this.generateSongMnemonic(word);
            case 'brainrot':
                return await this.generateBrainrotMnemonic(word);
            case 'chatbot':
                return await this.initiateChatbotConversation(word);
            default:
                return 'Please select a valid mode';
        }
    }

    async generateBrainrotMnemonic(word) {
        const response = await this.callOpenAI([
            {
                role: "system",
                content: "You are a creative assistant that creates fun, engaging, and internet-culture inspired video scripts. Make it trendy and memorable."
            },
            {
                role: "user",
                content: `Create a short, engaging video script for learning about: ${word}. Use internet culture, memes, and trending formats to make it memorable.`
            }
        ]);
        return response;
    }

    async generateSongMnemonic(word) {
        const songTemplates = {
            pop: {
                title: "APT by ROSE and Bruno Mars",
                style: "K-pop song with Rose's style",
                pattern: "Follow Rose's APT song structure with its unique rhythm and flow. Match the exact melody and style of APT, including the catchy chorus and verse patterns."
            },
            rap: {
                title: "DNA by Kendrick Lamar",
                style: "aggressive rap with Kendrick's style",
                pattern: "Use Kendrick's DNA flow with its intense delivery, rapid-fire verses, and the repeated 'I got' phrases. Match the exact rhythm and energy of DNA."
            },
            nursery: {
                title: "Mary Had a Little Lamb",
                style: "simple nursery rhyme",
                pattern: "Use simple, repetitive patterns like Mary Had a Little Lamb. Keep the same rhythm and melody, making it easy for children to remember."
            }
        };

        const style = this.currentSong;
        if (!songTemplates[style]) {
            console.error('Invalid song style:', style);
            return 'Error: Invalid song style selected';
        }

        const template = songTemplates[style];
        const systemPrompt = `You are writing a ${template.style} about ${word}. 
Your response should follow these rules:
1. Match the EXACT style, flow, and melody of ${template.title}
2. ${template.pattern}
3. Keep the exact same rhythm and structure as the original song
4. Format verses and chorus clearly with line breaks
5. Make sure each line matches the syllable count and rhythm of the original song
6. Use similar rhyme schemes and patterns as the original song
7. Include a clear chorus that repeats with the same pattern as the original`;

        const response = await this.callOpenAI([
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: `Write lyrics about ${word} that EXACTLY match the style, flow, and melody of ${template.title}. Make sure it can be sung to the same tune.`
            }
        ]);

        return `<div class="title">🎵 ${template.title} Style 🎵</div>\n\n${response}`;
    }

    async initiateChatbotConversation(word) {
        const characterPrompt = this.getCharacterPrompt();
        const initialMessage = await this.callOpenAI([
            {
                role: "system",
                content: characterPrompt
            },
            {
                role: "user",
                content: `I want to learn about: ${word}. Can you help me understand it better?`
            }
        ]);
        
        this.chatHistory = [
            { role: 'system', content: `Character: ${this.currentCharacter}` },
            { role: 'bot', content: initialMessage }
        ];
        
        return initialMessage;
    }

    async sendChatMessage(message) {
        this.chatHistory.push({ role: 'user', content: message });
        
        const response = await this.callOpenAI([
            {
                role: "system",
                content: this.getCharacterPrompt()
            },
            ...this.chatHistory.map(msg => ({
                role: msg.role === 'bot' ? 'assistant' : msg.role,
                content: msg.content
            }))
        ]);
        
        this.chatHistory.push({ role: 'bot', content: response });
        return response;
    }

    async callOpenAI(messages) {
        if (!this.apiKey) {
            throw new Error('Please enter your OpenAI API key first');
        }

        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
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
            mode: this.currentMode,
            options: this.getCurrentModeOptions()
        };

        this.savedMnemonics.push(mnemonicData);
        localStorage.setItem('savedMnemonics', JSON.stringify(this.savedMnemonics));
    }

    getCurrentModeOptions() {
        switch(this.currentMode) {
            case 'brainrot':
                return { voice: this.currentVoice, video: this.currentVideo };
            case 'song':
                return { style: this.currentSong };
            case 'chatbot':
                return { character: this.currentCharacter };
            default:
                return {};
        }
    }

    getCharacterPrompt() {
        const prompts = {
            'naruto': "You are Naruto Uzumaki, the energetic ninja who never gives up! Respond with enthusiasm, use 'dattebayo' occasionally, and reference your ninja way and experiences. Help others learn while maintaining your determined and optimistic personality. Use ninja analogies when explaining concepts.",
            'lebron': "You are LeBron James, one of the greatest basketball players of all time. Share your knowledge while drawing parallels to basketball and your career experiences. Be motivational, professional, and occasionally reference your championships and career achievements. Use sports analogies to explain concepts.",
            'batman': "You are Batman, the world's greatest detective and protector of Gotham City. Respond in a deep, serious tone while drawing from your vast knowledge and experience. Use analogies related to crime-solving, justice, and your gadgets to explain concepts. Occasionally reference your experiences in Gotham."
        };
        return prompts[this.currentCharacter] || prompts['naruto'];
    }
}

// Add this function at the top level of your file
function animateText(text, element) {
    // Remove any bracketed text
    text = text.replace(/\[.*?\]/g, '').trim();
    
    // Clear previous content
    element.innerHTML = '';
    
    // Split text into chunks of 3-5 words
    const words = text.split(' ');
    const chunks = [];
    let currentChunk = [];
    
    words.forEach(word => {
        currentChunk.push(word);
        if (currentChunk.length >= (Math.random() * 3 + 3)) { // Random 3-5 words
            chunks.push(currentChunk.join(' '));
            currentChunk = [];
        }
    });
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }

    // Create and position the text container
    const textContainer = document.createElement('div');
    textContainer.style.position = 'absolute';
    textContainer.style.top = '10%';  // Position near the top
    textContainer.style.left = '50%';
    textContainer.style.transform = 'translateX(-50%)';
    textContainer.style.width = '90%';
    textContainer.style.textAlign = 'center';
    element.appendChild(textContainer);

    let currentIndex = 0;
    
    function showNextChunk() {
        textContainer.textContent = chunks[currentIndex];
        currentIndex = (currentIndex + 1) % chunks.length;
        setTimeout(showNextChunk, 2000); // Show each chunk for 2 seconds
    }
    
    showNextChunk();
}

function formatLyrics(text) {
    // Split into title and lyrics
    const parts = text.split('\n\n');
    const title = parts[0];
    const lyrics = parts.slice(1).join('\n\n');

    // Split the lyrics into sections
    const sections = lyrics.split('\n\n');
    let formattedText = `${title}\n\n`;  // Keep the title
    
    sections.forEach((section, index) => {
        // Add extra newline before each section for better spacing
        formattedText += '\n';
        
        if (section.toLowerCase().includes('chorus') || 
            section.toLowerCase().includes('[chorus]')) {
            // Format chorus
            formattedText += `<div class="chorus">${
                section.replace('[Chorus]', '')
                      .replace('Chorus:', '')
                      .trim()
                      .split('\n')
                      .join('\n')
            }</div>\n`;
        } else {
            // Format verse
            formattedText += `<div class="verse">${
                section.trim()
                      .split('\n')
                      .join('\n')
            }</div>\n`;
        }
    });
    
    return formattedText;
}

// DOM interaction code
document.addEventListener('DOMContentLoaded', () => {
    const generator = new MnemonicGenerator();
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const wordInput = document.getElementById('wordInput');
    const generateBtn = document.getElementById('generateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const resultDiv = document.getElementById('result');
    const loadingSpinner = document.getElementById('loading');
    const savedList = document.getElementById('savedList');
    const chatInterface = document.getElementById('chatInterface');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const videoResult = document.getElementById('videoResult');

    function showModeOptions(mode) {
        // Hide all mode options and chat interface
        document.querySelectorAll('.mode-options').forEach(option => {
            option.style.display = 'none';
        });
        chatInterface.style.display = 'none';
        videoResult.style.display = 'none';
        resultDiv.style.display = 'block';
        saveBtn.style.display = 'none';  // Hide save button by default
        
        // Show the options for the selected mode
        const optionsToShow = document.getElementById(`${mode}Options`);
        if (optionsToShow) {
            optionsToShow.style.display = 'block';
        }
    }

    function addChatMessage(message, isUser = false) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // API Key handling
    if (generator.apiKey) {
        apiKeyInput.value = generator.apiKey;
    }

    saveApiKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            generator.setApiKey(key);
            alert('API Key saved successfully!');
        } else {
            alert('Please enter an API key');
        }
    });

    // Mode selection
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            generator.currentMode = btn.dataset.mode;
            showModeOptions(btn.dataset.mode);
        });
    });

    // Character selection handling
    const characterSelect = document.getElementById('character');
    characterSelect.addEventListener('change', async (e) => {
        const character = e.target.value;
        generator.currentCharacter = character;
        
        // Update chat interface appearance
        const chatInterface = document.getElementById('chatInterface');
        chatInterface.className = 'chat-interface ' + character;
        
        // Remove existing character image if any
        const existingCharacter = chatInterface.querySelector('.chat-character');
        if (existingCharacter) {
            existingCharacter.remove();
        }
        
        // Add new character image
        const characterImg = document.createElement('img');
        characterImg.className = 'chat-character';
        characterImg.src = `static/images/${character}-character.png`;
        characterImg.alt = character;
        chatInterface.appendChild(characterImg);

        // Reset chat messages
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        generator.chatHistory = [];

        // Get word input and reinitiate conversation if there's a word
        const word = wordInput.value.trim();
        if (word) {
            try {
                loadingSpinner.style.display = 'block';
                const response = await generator.initiateChatbotConversation(word);
                addChatMessage(response, false);
            } catch (error) {
                addChatMessage('Error: ' + error.message, false);
            } finally {
                loadingSpinner.style.display = 'none';
            }
        }
    });

    chatInterface.addEventListener('click', () => {
        chatInput.focus();
    });

    sendMessageBtn.addEventListener('click', async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        addChatMessage(message, true);
        chatInput.value = '';
        
        try {
            const response = await generator.sendChatMessage(message);
            addChatMessage(response);
        } catch (error) {
            addChatMessage('Error: Could not send message. Please try again.');
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessageBtn.click();
        }
    });

    generateBtn.addEventListener('click', async () => {
        const word = wordInput.value.trim();
        if (!word) {
            alert('Please enter a word or concept');
            return;
        }

        if (!generator.apiKey) {
            alert('Please enter your OpenAI API key first');
            return;
        }

        try {
            loadingSpinner.style.display = 'block';
            resultDiv.innerHTML = '';
            
            if (generator.currentMode === 'chatbot') {
                chatInterface.style.display = 'block';
                videoResult.style.display = 'none';
                resultDiv.style.display = 'none';
                saveBtn.style.display = 'none';

                // Set initial character appearance
                const character = characterSelect.value;
                generator.currentCharacter = character;
                chatInterface.className = 'chat-interface ' + character;
                
                // Add character image
                const existingCharacter = chatInterface.querySelector('.chat-character');
                if (existingCharacter) {
                    existingCharacter.remove();
                }
                const characterImg = document.createElement('img');
                characterImg.className = 'chat-character';
                characterImg.src = `static/images/${character}-character.png`;
                characterImg.alt = character;
                chatInterface.appendChild(characterImg);

                const response = await generator.initiateChatbotConversation(word);
                addChatMessage(response, false);
            } else if (generator.currentMode === 'brainrot') {
                // Show video result for brainrot mode
                resultDiv.style.display = 'none';
                chatInterface.style.display = 'none';
                videoResult.style.display = 'block';
                saveBtn.style.display = 'block';  // Show save button in brainrot mode
                
                // Get the selected video source
                const selectedVideo = document.querySelector('.video-box.active');
                const videoSrc = selectedVideo ? selectedVideo.dataset.video : '';
                
                // Set up the video and text
                const resultVideoEl = document.getElementById('resultVideo');
                const videoTextEl = document.getElementById('videoText');
                
                resultVideoEl.src = videoSrc;
                resultVideoEl.play();
                
                // Start text animation
                const response = await generator.generateMnemonic(word);
                animateText(response, videoTextEl);
            } else if (generator.currentMode === 'song') {
                // Show regular result for song mode
                resultDiv.style.display = 'block';
                chatInterface.style.display = 'none';
                videoResult.style.display = 'none';
                saveBtn.style.display = 'block';
                
                const songResponse = await generator.generateSongMnemonic(word);
                const formattedLyrics = formatLyrics(songResponse);
                resultDiv.innerHTML = `<div class="mnemonic">${formattedLyrics}</div>`;
            }
        } catch (error) {
            resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            if (error.message.includes('API key')) {
                apiKeyInput.focus();
            }
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    saveBtn.addEventListener('click', () => {
        const word = wordInput.value.trim();
        const mnemonic = resultDiv.querySelector('.mnemonic')?.textContent;
        
        if (mnemonic) {
            try {
                generator.saveMnemonic(word, mnemonic);
                updateSavedList();
                alert('Mnemonic saved successfully!');
            } catch (error) {
                alert(`Error saving mnemonic: ${error.message}`);
            }
        }
    });

    function updateSavedList() {
        const mnemonics = generator.savedMnemonics;
        savedList.innerHTML = mnemonics.map(item => {
            let details = `Mode: ${item.mode}`;
            
            if (item.options) {
                switch(item.mode) {
                    case 'brainrot':
                        details += ` | Voice: ${item.options.voice}`;
                        if (item.options.video) details += ` | Video: ${item.options.video}`;
                        break;
                    case 'song':
                        details += ` | Style: ${item.options.style}`;
                        break;
                    case 'chatbot':
                        details += ` | Character: ${item.options.character}`;
                        break;
                }
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

    // Video selection handling
    const videoBoxes = document.querySelectorAll('.video-box');
    videoBoxes.forEach(box => {
        const video = box.querySelector('video');
        
        // Start playing video on hover
        box.addEventListener('mouseenter', () => {
            video.play();
        });
        
        // Pause video when mouse leaves
        box.addEventListener('mouseleave', () => {
            video.pause();
        });
        
        // Handle video selection
        box.addEventListener('click', () => {
            // Remove active class from all boxes
            videoBoxes.forEach(b => b.classList.remove('active'));
            // Add active class to clicked box
            box.classList.add('active');
            
            // Update current video selection
            generator.currentVideo = box.dataset.video;
            
            // Update the result video if it exists
            const resultVideo = document.querySelector('#videoResult video');
            if (resultVideo) {
                resultVideo.src = video.src;
                resultVideo.play();
            }
        });
    });

    // Initialize the first video as active
    if (videoBoxes.length > 0) {
        const firstVideo = videoBoxes[0];
        firstVideo.classList.add('active');
        generator.currentVideo = firstVideo.dataset.video;
    }

    // Initialize
    const initialMode = 'brainrot';
    document.querySelector(`[data-mode="${initialMode}"]`).classList.add('active');
    showModeOptions(initialMode);
    updateSavedList();
});
