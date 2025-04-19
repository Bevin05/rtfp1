import historyRoutes from './routes/history.js';
import shareRoutes from './routes/share.js';

app.use('/api/history', historyRoutes);
app.use('/api/share', shareRoutes); 