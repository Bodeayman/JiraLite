// Using native fetch available in Node.js 18+


const API_URL = 'http://localhost:3001/api';

async function simulateConflict() {
    console.log("--- Simulating Server-Side Conflict ---");

    try {
        const response = await fetch(`${API_URL}/board`);
        const data = await response.json();

        const allCards = data.columns.flatMap(col => col.cards);

        if (allCards.length === 0) {
            console.error("No cards found on server. Please create a card in the app first.");
            return;
        }

        const cardToUpdate = allCards[0];
        console.log(`Found card to update: "${cardToUpdate.title}" (ID: ${cardToUpdate.id}) (Version: ${cardToUpdate.version})`);

        const newTitle = `${cardToUpdate.title} (Server Edit ${Date.now().toString().slice(-4)})`;

        const updateResponse = await fetch(`${API_URL}/cards/${cardToUpdate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: newTitle,
                list_id: cardToUpdate.list_id,
                version: cardToUpdate.version
            })
        });

        if (updateResponse.ok) {
            const updatedCard = await updateResponse.json();
            console.log("Successfully updated card on server!");
            console.log(`   New Title: "${updatedCard.title}"`);
            console.log(`   New Version: ${updatedCard.version}`);
            console.log("\nNow go back to your OFFLINE app and update this same card. Then go ONLINE to trigger the conflict.");
        } else {
            console.error("Failed to update card:", await updateResponse.text());
        }

    } catch (error) {
        console.error("Error connecting to server:", error.message);
    }
}

simulateConflict();
