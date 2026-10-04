import React from "react"
import { motion } from "framer-motion"
import { fadeIn, staggerContainer } from "../utils/motion"
import collections  from "../lib/collections/collections"
import { useOrdinalsHost } from "../context/OrdinalsHostContext"
import ordImage from '/images/ordinals.svg';



const Collections = () => {
  const ordHost = useOrdinalsHost();
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      id="team"
      className="flex flex-col items-center justify-center">
      <motion.div
        variants={fadeIn("up", "tween", 0.2, 1)}
        className="w-full">

  <div className="mb-6 text-center">
    <h1 className="text-3xl font-black uppercase md:text-5xl">Collections</h1>
    <p className="mt-2 text-base-content/60">Explore inscribed packs and visuals with a consistent BitcoinAudio look.</p>
  </div>

<div className="flex flex-wrap justify-center gap-6">
    {collections.map((item, index) => {
      const contentUrl = `${ordHost}/content/${item.insID}`;
      const inscriptionUrl = `${ordHost}/inscription/${item.insID}`;
      return (
      <div
        key={`${item.insID}-${index}`}
        className="card mt-4 max-w-2xl gap-4 rounded-box border border-base-300 bg-base-200 transition duration-300 hover:-translate-y-1 hover:border-primary/50"
      >
        <div className="card-body">

          <iframe src={contentUrl} title={item.name}  height="100%" width="100%" allowFullScreen></iframe>
         

          <h2 className="card-title font-urbanist text-3xl font-black">
            {item.name}
          </h2>
          <p className="text-md font-urbanist font-medium text-base-content/60">
            {item.description}
          </p> 

          <div  className="card-actions justify-center">
            <ul className="menu menu-horizontal mt-1 rounded-box bg-base-100">
              {/* <li>
                 <a class="tooltip" data-tip="Home">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </a>
              </li> */}
              <li>
                <a className="tooltip" data-tip="Details" href={inscriptionUrl} target="_blank" rel="noreferrer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </a>
              </li>
              <li>
                <a className="tooltip" data-tip="Ordinal" href={contentUrl} target="_blank" rel="noreferrer">
                  <img className="size-5" src={ordImage} alt="IOM" />
                </a>
              </li>
              {item.name === "The Ides of March" && (
                <li>
                <a className="tooltip" data-tip="Collect" href="https://www.satflow.com/ordinals/inscribedaudio" target="_blank" rel="noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" stroke="currentColor" strokeWidth="2" className="size-5">
                    <path d="M3 3h18v4H3z"/>
                    <path d="M5 7v13h14V7"/>
                    <path d="M9 21V7"/>
                    <path d="M15 21V7"/>
                    <path d="M5 10h14"/>
                    <path d="M5 14h14"/>
                  </svg>
                </a>
              </li>
              )}
            </ul>
            </div>
        </div>
      </div>
      );
    })}

  </div>


      </motion.div>
      
    </motion.div>
  )
}

export default Collections
