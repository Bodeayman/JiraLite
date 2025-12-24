import { v4 as uuidv4 } from 'uuid';
import { saveList, saveCard } from '../services/storage';

// Sample data for generating realistic dummy content
const cardTitles = [
    'Implement user authentication',
    'Fix responsive design issues',
    'Add dark mode support',
    'Optimize database queries',
    'Create API documentation',
    'Refactor legacy code',
    'Add unit tests',
    'Fix memory leak',
    'Improve error handling',
    'Update dependencies',
    'Design new dashboard',
    'Implement search functionality',
    'Add data validation',
    'Create user onboarding flow',
    'Fix cross-browser compatibility',
    'Optimize image loading',
    'Add analytics tracking',
    'Implement caching strategy',
    'Create admin panel',
    'Add export functionality',
    'Fix security vulnerabilities',
    'Improve accessibility',
    'Add multi-language support',
    'Optimize bundle size',
    'Implement real-time updates',
    'Add notification system',
    'Create backup system',
    'Fix performance issues',
    'Add logging system',
    'Implement rate limiting'
];

const cardDescriptions = [
    'This task requires implementing a secure authentication system with JWT tokens.',
    'Need to fix responsive design issues on mobile devices.',
    'Add support for dark mode across all components.',
    'Optimize database queries to improve performance.',
    'Create comprehensive API documentation for developers.',
    'Refactor legacy code to improve maintainability.',
    'Add unit tests to increase code coverage.',
    'Fix memory leak in the application.',
    'Improve error handling and user feedback.',
    'Update all dependencies to latest versions.',
    'Design a new dashboard with improved UX.',
    'Implement full-text search functionality.',
    'Add comprehensive data validation.',
    'Create an intuitive user onboarding flow.',
    'Fix cross-browser compatibility issues.',
    'Optimize image loading for better performance.',
    'Add analytics tracking for user behavior.',
    'Implement an efficient caching strategy.',
    'Create a comprehensive admin panel.',
    'Add export functionality for data.',
    'Fix identified security vulnerabilities.',
    'Improve accessibility for all users.',
    'Add multi-language support.',
    'Optimize bundle size for faster loading.',
    'Implement real-time updates using WebSockets.',
    'Add a notification system.',
    'Create an automated backup system.',
    'Fix performance issues identified in profiling.',
    'Add comprehensive logging system.',
    'Implement rate limiting for API endpoints.'
];

const tags = [
    'frontend', 'backend', 'bug', 'feature', 'urgent', 'high-priority',
    'low-priority', 'documentation', 'testing', 'refactoring', 'performance',
    'security', 'ui/ux', 'api', 'database', 'mobile', 'desktop', 'devops',
    'design', 'research', 'planning', 'in-progress', 'review', 'done'
];

const listTitles = [
    'To Do',
    'In Progress',
    'Review',
    'Testing',
    'Done',
    'Backlog',
    'Blocked',
    'Sprint Planning'
];

/**
 * Generate a random item from an array
 */
const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

/**
 * Generate random tags for a card
 */
const generateTags = () => {
    const numTags = Math.floor(Math.random() * 4) + 1; // 1-4 tags
    const selectedTags = [];
    const availableTags = [...tags];

    for (let i = 0; i < numTags; i++) {
        const randomIndex = Math.floor(Math.random() * availableTags.length);
        selectedTags.push(availableTags.splice(randomIndex, 1)[0]);
    }

    return selectedTags;
};

/**
 * Generate a random card
 */
const generateCard = (listId, orderId) => {
    const title = randomItem(cardTitles) + (Math.random() > 0.7 ? ` #${Math.floor(Math.random() * 1000)}` : '');
    const description = Math.random() > 0.5 ? randomItem(cardDescriptions) : '';

    return {
        id: uuidv4(),
        title,
        description,
        list_id: listId,
        order_id: orderId,
        last_modified: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in last 30 days
        tags: generateTags()
    };
};

/**
 * Seed the database with dummy data
 * @param {number} totalCards - Total number of cards to generate (default: 500)
 * @param {number} numLists - Number of lists to create (default: 8)
 * @returns {Promise<{lists: number, cards: number}>} Statistics about seeded data
 */
export const seedDatabase = async (totalCards = 500, numLists = 8) => {
    console.log(`Starting data seeding: ${totalCards} cards across ${numLists} lists...`);

    const startTime = performance.now();

    // Clear existing data first (optional - comment out if you want to keep existing data)
    try {
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('JiraLiteDB', 1);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        // Clear existing data using transactions
        await Promise.all([
            new Promise((resolve, reject) => {
                const listsTx = db.transaction('lists', 'readwrite');
                listsTx.objectStore('lists').clear();
                listsTx.oncomplete = () => resolve();
                listsTx.onerror = () => reject(listsTx.error);
            }),
            new Promise((resolve, reject) => {
                const cardsTx = db.transaction('cards', 'readwrite');
                cardsTx.objectStore('cards').clear();
                cardsTx.oncomplete = () => resolve();
                cardsTx.onerror = () => reject(cardsTx.error);
            })
        ]);

        console.log('Cleared existing data');
    } catch (error) {
        console.warn('Could not clear existing data:', error);
    }

    // Generate lists
    const lists = [];
    for (let i = 0; i < numLists; i++) {
        const list = {
            id: uuidv4(),
            title: listTitles[i] || `List ${i + 1}`,
            archived: false,
            order: i,
            last_modified: Date.now(),
            cards: []
        };
        lists.push(list);
        await saveList(list);
    }

    console.log(`Created ${lists.length} lists`);

    // Distribute cards across lists
    const cardsPerList = Math.floor(totalCards / numLists);
    const remainder = totalCards % numLists;

    let cardCount = 0;

    for (let i = 0; i < lists.length; i++) {
        const listId = lists[i].id;
        const cardsForThisList = cardsPerList + (i < remainder ? 1 : 0);

        // Batch save cards for better performance
        const cardPromises = [];

        for (let j = 0; j < cardsForThisList; j++) {
            const card = generateCard(listId, j);
            cardPromises.push(saveCard(card));
            cardCount++;

            // Log progress every 50 cards
            if (cardCount % 50 === 0) {
                console.log(`Seeded ${cardCount}/${totalCards} cards...`);
            }
        }

        // Wait for all cards in this list to be saved
        await Promise.all(cardPromises);
    }

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Data seeding completed!`);
    console.log(`   - Lists created: ${lists.length}`);
    console.log(`   - Cards created: ${cardCount}`);
    console.log(`   - Time taken: ${duration}s`);

    return {
        lists: lists.length,
        cards: cardCount,
        duration: parseFloat(duration)
    };
};

/**
 * Run the seeding script (for use in browser console or as a standalone script)
 */
if (typeof window !== 'undefined') {
    // Make it available globally for easy access from browser console
    window.seedDatabase = seedDatabase;
    console.log('💡 Data seeding script loaded!');
    console.log('   Run: seedDatabase(500, 8) to seed 500 cards across 8 lists');
    console.log('   Or: seedDatabase(1000, 10) to seed 1000 cards across 10 lists');
}

