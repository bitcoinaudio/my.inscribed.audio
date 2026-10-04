import React from "react"
import { motion } from "framer-motion"
import { fadeIn, staggerContainer } from "../utils/motion"
import { useOrdinalsHost } from "../context/OrdinalsHostContext"

const IDES_OF_MARCH_ID = "b1ade815da823de16f0dc26417c5bfb9caefc9005f0e9585b1f0072eb7e43605i0";

const Feature = () => {
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
        className="flex flex-col items-center justify-center">

<div id="samplerr" className="hero flex justify-center rounded-box border border-base-300 bg-base-200 px-4 py-8 shadow-xl shadow-black/20">
	<div className="hero-content flex-col gap-6 lg:flex-row-reverse">
	<p className="max-w-2xl text-lg leading-relaxed text-base-content/75 md:text-xl">
	Welcome to the future of music ownership, where legendary hip-hop meets Bitcoin innovation.

The Ides Of March isn’t just another music NFT—it’s a revolutionary approach to digital music collecting and creation on Bitcoin Ordinals.
		</p>
		<div className="text-center lg:text-start">
			<h1 className="font-urbanist text-xl font-black uppercase text-primary md:text-5xl">
				
					   <span className=" ">The Ides of March</span>				   
			</h1>
 
			<div className="flex justify-center">
 
			<iframe className="samplerr border border-base-300 bg-base-100" src={`${ordHost}/content/${IDES_OF_MARCH_ID}`} title="ordinal"  allowFullScreen ></iframe>
			</div>
		</div>

		
		
	  </div>
	</div>	


      </motion.div>
      
    </motion.div>
  )
}

export default Feature
