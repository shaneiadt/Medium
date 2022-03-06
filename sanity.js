import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

export const config = {
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  apiVersion: '2020-03-06',
  useCdn: process.env.NODE_ENV === 'production',
}

export const sanityClient = createClient(config)

const builder = imageUrlBuilder(config);

export const urlFor = (source) => builder.image(source);
