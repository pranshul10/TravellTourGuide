exports.getPlaceholderImage = (req, res) => {
    const { width, height } = req.params;
    if (!width || !height || isNaN(parseInt(width)) || isNaN(parseInt(height))) {
        return res.status(400).send('Invalid width or height parameters.');
    }
    // Redirect to an external placeholder service
    res.redirect(`https://via.placeholder.com/${width}x${height}.png?text=Travel+Guide`);
};