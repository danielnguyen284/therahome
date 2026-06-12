const fs = require('fs');
const content = fs.readFileSync('node_modules/react-native-body-highlighter/index.js', 'utf-8');
console.log(content.slice(0, 1000));
