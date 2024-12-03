// MnemonicGenerator class to handle OpenAI API interactions
class MnemonicGenerator {
    constructor() {
        this.savedMnemonics = this.loadSavedMnemonics();
        this.currentMode = 'brainrot';
        this.currentVoice = 'a';
        this.currentVideo = '';
        this.currentSong = 'pop';
        this.currentCharacter = 'naruto';
        this.chatHistory = [];
        this.apiKey = localStorage.getItem('openai_api_key') || '';
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('openai_api_key', key);
    }

    async generateMnemonic(word) {
        switch(this.currentMode) {
            case 'brainrot':
                return this.generateBrainrotMnemonic(word);
            case 'song':
                return this.generateSongMnemonic(word);
            case 'chatbot':
                return this.initiateChatbotConversation(word);
            default:
                return this.generateBrainrotMnemonic(word);
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
        // Predefined song templates
        const songTemplates = {
            pop: {
                title: "APT by Rose and Bruno Mars",
                lyrics: `아파트, 아파트, 아파트, 아파트
아파트, 아파트, uh, uh-huh, uh-huh
아파트, 아파트, 아파트, 아파트
아파트, 아파트, uh, uh-huh, uh-huh

Kissy face, kissy face sent to your phone, but
I'm trying to kiss your lips for real (uh-huh, uh-huh)
Red hearts, red hearts, that's what I'm on, yeah
Come give me somethin' I can feel, oh-oh-oh

Don't you want me like I want you, baby?
Don't you need me like I need you now?
Sleep tomorrow, but tonight go crazy
All you gotta do is just meet me at the

아파트, 아파트, 아파트, 아파트
아파트, 아파트, uh, uh-huh, uh-huh
아파트, 아파트, 아파트, 아파트
아파트, 아파트, uh, uh-huh, uh-huh`
            },
            rap: {
                title: "DNA by Kendrick Lamar",
                lyrics: `I got, I got, I got, I got
Loyalty, got royalty inside my DNA
Quarter piece, got war, and peace inside my DNA
I got power, poison, pain, and joy inside my DNA
I got hustle, though, ambition flow inside my DNA

I was born like this
Since one like this, immaculate conception
I transform like this, perform like this
Was Yeshua new weapon

I don't contemplate, I meditate
Then off your-, off your head
This that put-the-kids-to-bed

This that I got, I got, I got, I got
Realness, I just kill sh- 'cause it's in my DNA
I got millions, I got riches buildin' in my DNA
I got dark, I got evil that rot inside my DNA
I got off, I got troublesome heart inside my DNA
I just win again, then, win again like Wimbledon I serve`
            },
            nursery: {
                title: "Mary Had a Little Lamb",
                lyrics: `Mary had a little lamb
It's fleece was white as snow, yeah
Everywhere the child went
The lamb, the lamb was sure to go, yeah

He followed her to school one day
And broke the teacher's rule
And what a time did they have
That day at school

Tisket, tasket, baby alright
A green and yellow basket, now
I wrote a letter to my baby
And on my way I passed it, now
Hit it`
            }
        };

        // Get the selected song style
        const songStyle = this.currentSong;
        const template = songTemplates[songStyle];

        // Generate the song based on the template
        const response = await this.callOpenAI([
            {
                role: "system",
                content: `You are a professional songwriter specializing in ${songStyle} music. Create lyrics in the exact style of the following song, but about the topic provided. Maintain the same rhythm, flow, and structure. Reference song: ${template.title}\n\n${template.lyrics}`
            },
            {
                role: "user",
                content: `Write lyrics about: ${word}`
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
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
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

    // Character selection handler
    const characterSelect = document.getElementById('character');
    characterSelect.addEventListener('change', (e) => {
        generator.currentCharacter = e.target.value;
    });

    // Chat interface handlers
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
            alert('Please enter a word');
            return;
        }

        if (!generator.apiKey) {
            alert('Please enter your OpenAI API key first');
            return;
        }

        try {
            loadingSpinner.style.display = 'block';
            generateBtn.disabled = true;
            
            const response = await generator.generateMnemonic(word);
            
            if (generator.currentMode === 'chatbot') {
                // Show chat interface for chatbot mode
                resultDiv.style.display = 'none';
                chatInterface.style.display = 'block';
                videoResult.style.display = 'none';
                saveBtn.style.display = 'none';  // Hide save button in chatbot mode
                chatMessages.innerHTML = '';
                addChatMessage(response);
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
                animateText(response, videoTextEl);
            } else {
                // Show regular result for song mode
                resultDiv.style.display = 'block';
                chatInterface.style.display = 'none';
                videoResult.style.display = 'none';
                saveBtn.style.display = 'block';  // Show save button in song mode
                const formattedLyrics = formatLyrics(response);
                resultDiv.innerHTML = `<div class="mnemonic">${formattedLyrics}</div>`;
            }
        } catch (error) {
            resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            if (error.message.includes('API key')) {
                apiKeyInput.focus();
            }
        } finally {
            loadingSpinner.style.display = 'none';
            generateBtn.disabled = false;
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

    // Video box initialization and handlers
    const videoBoxes = document.querySelectorAll('.video-box');
    videoBoxes.forEach(box => {
        const video = box.querySelector('video');
        if (video) {
            // Set initial frame
            video.currentTime = 0;
            
            // Play on hover
            box.addEventListener('mouseenter', () => {
                video.play();
            });
            
            // Pause and reset on mouse leave
            box.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
            });
        }

        // Handle selection
        box.addEventListener('click', () => {
            if (box.dataset.video) {
                videoBoxes.forEach(b => b.classList.remove('active'));
                box.classList.add('active');
                generator.currentVideo = box.dataset.video;
            }
        });
    });

    // Initialize
    const initialMode = 'brainrot';
    document.querySelector(`[data-mode="${initialMode}"]`).classList.add('active');
    showModeOptions(initialMode);
    updateSavedList();
});
