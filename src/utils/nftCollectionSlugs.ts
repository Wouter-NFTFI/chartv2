/**
 * NFT Collection Slug Mappings
 * 
 * This file contains validated slug mappings for NFT collections that work with the NFT Price Floor API.
 * These slugs were validated through testing and are known to work with the API.
 */

/**
 * List of validated slugs that work with the NFT Price Floor API
 */
export const VALIDATED_SLUGS = [
  'cryptopunks',
  'bored-ape-yacht-club',
  'pudgy-penguins',
  'mutant-ape-yacht-club',
  'milady',
  'the-band-bears',
  'mad-lads',
  'doodles',
  'lil-pudgys',
  'space-doodles',
  'azuki',
  'the-boo-bears',
  'mocaverse',
  'genesis-creepz-by-overlord',
  'veefriends',
  'nodemonkes',
  'the-baby-bears-nft',
  'bitcoin-puppets',
  'quantum-cats',
  'bit-bears-by-berachain',
  'ocm-genesis',
  'v1-cryptopunks-wrapped',
  'meebits',
  'omb',
  'runestone',
  // Some collections from top loan volume with different slugs
  'autoglyphs', 
  'remilio-babies',
  'skulls-of-luci'
];

/**
 * Maps collection names to their validated API slugs
 * This is useful when the collection name in NFTfi differs from the slug in the NFT Price Floor API
 */
export const COLLECTION_NAME_TO_SLUG_MAP: Record<string, string> = {
  'Wrapped Cryptopunks': 'v1-cryptopunks-wrapped',
  'CryptoPunks 721': 'cryptopunks',
  'CryptoPunks': 'cryptopunks',
  'Bored Ape Yacht Club': 'bored-ape-yacht-club',
  'Pudgy Penguins': 'pudgy-penguins',
  'Autoglyphs': 'autoglyphs',
  'Azuki': 'azuki',
  'Chromie Squiggle by Snowfro': 'chromie-squiggle',
  'Milady Maker': 'milady',
  'Milady': 'milady',
  'Mutant Ape Yacht Club': 'mutant-ape-yacht-club',
  'MAYC': 'mutant-ape-yacht-club',
  'Doodles': 'doodles',
  'Fidenza by Tyler Hobbs': 'fidenza',
  'Lil Pudgys': 'lil-pudgys',
  'Redacted Remilio Babies': 'remilio-babies',
  'Skulls of Luci': 'skulls-of-luci',
  'Nodemonkes': 'nodemonkes',
  'VeeFriends': 'veefriends',
  'The Band Bears': 'the-band-bears',
  'Mad Lads': 'mad-lads',
  'Space Doodles': 'space-doodles',
  'The Boo Bears': 'the-boo-bears',
  'Mocaverse': 'mocaverse',
  'Genesis Creepz': 'genesis-creepz-by-overlord',
  'The Baby Bears': 'the-baby-bears-nft',
  'Bitcoin Puppets': 'bitcoin-puppets',
  'Quantum Cats': 'quantum-cats',
  'Bit Bears': 'bit-bears-by-berachain',
  'OCM Genesis': 'ocm-genesis',
  'Meebits': 'meebits',
  'OMB': 'omb',
  'Runestone': 'runestone'
};

/**
 * Maps collection names to their Reservoir API slugs
 * These slugs are validated to work with the Reservoir API
 */
export const COLLECTION_NAME_TO_RESERVOIR_SLUG_MAP: Record<string, string> = {
  'Wrapped Cryptopunks': 'cryptopunks',
  'CryptoPunks 721': 'cryptopunks',
  'CryptoPunks': 'cryptopunks',
  'Bored Ape Yacht Club': 'boredapeyachtclub',
  'Pudgy Penguins': 'pudgypenguins',
  'Autoglyphs': 'autoglyphs',
  'Azuki': 'azuki',
  'Chromie Squiggle by Snowfro': 'chromiesquiggle',
  'Milady Maker': 'milady',
  'Milady': 'milady',
  'Mutant Ape Yacht Club': 'mutant-ape-yacht-club',
  'MAYC': 'mutant-ape-yacht-club',
  'Doodles': 'doodles',
  'Fidenza by Tyler Hobbs': 'fidenza',
  'Lil Pudgys': 'lilpudgys',
  'Redacted Remilio Babies': 'remilio-babies',
  'Skulls of Luci': 'skulls-of-luci',
  'Nodemonkes': 'nodemonkes',
  'VeeFriends': 'veefriends',
  'The Band Bears': 'thebandbears',
  'Mad Lads': 'madlads',
  'Space Doodles': 'spacedoodles',
  'The Boo Bears': 'theboobears',
  'Mocaverse': 'mocaverse',
  'Genesis Creepz': 'genesiscreepz',
  'The Baby Bears': 'thebabybears',
  'Bitcoin Puppets': 'bitcoinpuppets',
  'Quantum Cats': 'quantumcats',
  'Bit Bears': 'bitbears',
  'OCM Genesis': 'ocmgenesis',
  'Meebits': 'meebits',
  'OMB': 'omb',
  'Runestone': 'runestone'
};

/**
 * List of slugs that were tested but don't work with the NFT Price Floor API
 */
export const UNAVAILABLE_SLUGS = [
  'autoglyphs-by-larva-labs',
  'chromie-squiggle-art-blocks-curated-by-snowfro',
  'fidenza-art-blocks-curated-by-tyler-hobbs',
  'damien-hirst-the-currency-by-damien-hirst',
  'ringers-art-blocks-curated-by-dmitri-cherniak'
]; 