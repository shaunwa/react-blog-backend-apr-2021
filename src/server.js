import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';

const startServer = async () => {
    const app = express();
    app.use(express.static(path.join(__dirname, '/build')));
    app.use(express.json());

    const client = await MongoClient.connect('mongodb://localhost:27017', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    const db = client.db('react-blog-db-apr-2021');
    
    // Loading information about an article
    // GET /articles/:name --> { upvotes: 1, comments: [...] }
    app.get('/articles/:name', async (req, res) => {
        const { name } = req.params;
        const articleInfo = await db.collection('articles').findOne({ name });
    
        if (!articleInfo) return res.status(404).json({ message: 'No article with that name found' });
    
        res.status(200).json(articleInfo);
    });
    
    // Adding upvotes to an article
    // PUT /articles/:name/upvotes --> { upvotes: 2, comments: [...] }
    app.put('/articles/:name/upvotes', async (req, res) => {
        const { name } = req.params;

        await db.collection('articles').updateOne(
            { name },
            { $inc: { upvotes: 1 } }
        );

        const articleInfo = await db.collection('articles').findOne({ name });
    
        if (!articleInfo) return res.status(404).json({ message: 'No article with that name found' });
    
        res.status(200).json(articleInfo);
    });
    
    // Adding comments to an article
    // POST /articles/:name/comments { author: 'Shaun', text: 'Great!' }
    // -----> { upvotes: 1, comments: [{ author: ... }] }
    app.post('/articles/:name/comments', async (req, res) => {
        const { name } = req.params;
        const { author, text } = req.body;

        await db.collection('articles').updateOne(
            { name },
            { $push: { comments: { author, text } } },
        );

        const articleInfo = await db.collection('articles').findOne({ name });
    
        if (!articleInfo) return res.status(404).json({ message: 'No article with that name found' });
    
        res.status(200).json(articleInfo);
    });

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '/build/index.html'));
    });
    
    app.listen(8080, () => console.log('Server is listening on port 8080'));
}

startServer();