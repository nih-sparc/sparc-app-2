import axios from 'axios'

function randomAssign(itemString, number) {
    let itemArray = []
    const items = [...new Set(itemString.split(',').map(item => item.trim()).filter(item => item))]
    while (itemArray.length < number) {
        const item = items[Math.floor(Math.random() * items.length)]
        if (!itemArray.includes(item)) {
            itemArray.push(item)
        }
    }
    return itemArray.join(', ')
}

async function generateDatasetIds(config) {
    let datasetIds
    await axios
        .get(`${config.env.PORTAL_API}/all_dataset_ids`)
        .then((response) => {
            datasetIds = randomAssign(response.data, 5)
        })
        .catch((error) => {
            console.error('Error:', error.message)
        });
    return datasetIds
}

export default async function dynamicConfig(config) {
    for (const env in DYNAMICENVS) {
        if (!config.env[env]) {
            config.env[env] = randomAssign(DYNAMICENVS[env].value, DYNAMICENVS[env].number)
        }
    }
    if (!config.env.DATASET_IDS) {
        config.env.DATASET_IDS = await generateDatasetIds(config)
    }
    return config
}

const DYNAMICENVS = {
    'PAGE_LIMIT': { 'value': '10, 20, 50, View All', 'number': 1 }, // fixed, no need to change
    'SEARCH_KEYWORDS': {
        'value': 'Vagus, Spine, Heart, Microscopy, Electrophysiology, Pig',
        'number': 2
    },
    'FILTER_FACET': {
        'value': 'Central Nervous System, Brain, Human, Connectivity, Male, Adult',
        'number': 1 // fixed, no need to change
    },
    'MULTIPLE_FILTER_FACETS': {
        'value': 'Central Nervous System, Brain, Human, Connectivity, Male, Adult',
        'number': 2
    },
    'TAXON_MODELS': {
        'value': 'Human Female, Human Male, Rat, Mouse, Pig, Cat', // fixed, no need to change
        'number': 2
    },
    'THREE_SYNC_VIEW': { 'value': 'Human Female, Human Male', 'number': 1 }, // fixed, no need to change
    'SEARCH_IN_MAP': {
        'value': 'Heart, Lung, Colon, Stomach, Liver',
        'number': 2
    },
    'SCAFFOLD_DATASET_IDS': {
        'value': '150, 155, 292, 102, 223',
        'number': 2
    },
}