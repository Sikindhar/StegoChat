import React, { useState } from 'react';
import axios from 'axios';
import './App.css';


function App() {
  const [recipient, setRecipient] = useState('');
  const [secretText, setSecretText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [decodedText, setDecodedText] = useState('');

  const handleEmbed = async () => {
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('text', secretText);

    try {
      const response = await axios.post('http://localhost:5000/embed', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Text embedded successfully. Image path: ' + response.data.imagePath);
    } catch (error) {
      console.error('Error embedding text', error);
    }
  };

  const handleExtract = async () => {
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await axios.post('http://localhost:5000/extract', formData);
      setDecodedText(response.data.text);
    } catch (error) {
      console.error('Error extracting text', error);
    }
  };

  return (
    <div className="App" style={{
      backgroundImage: "url(./BackgroundStegoChat.jpeg)",
      backgroundSize: "cover"
      
    }}>
      <h1>StegoChat</h1>
      <div>
        <h2>Embed Text in Image</h2>
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          accept="image/*"
        />
        <input
          type="text"
          placeholder="Secret Text"
          value={secretText}
          onChange={(e) => setSecretText(e.target.value)}
        />
        <button onClick={handleEmbed}>Embed and Send</button>
      </div>
      <div>
        <h2>Extract Text from Image</h2>
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          accept="image/*"
        />
        <button onClick={handleExtract}>Extract</button>
        {decodedText && <p>Decoded Text: {decodedText}</p>}
      </div>
    </div>
  );
}

export default App;
