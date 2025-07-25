import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import './Landing.css';

const Landing = () => {
  const cursorGlowRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursorGlowRef.current) {
        cursorGlowRef.current.style.left = `${e.clientX}px`;
        cursorGlowRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-up').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      <div className="cursor-glow" ref={cursorGlowRef}></div>
      
      <section className="hero">
        <div className="container">
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            You're tired of explaining yourself on first dates.
          </motion.h1>
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Join a community where your values come first.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link to="/register" className="btn-primary">
              Apply to Join
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="story">
        <div className="container">
          <div className="story-content fade-up">
            <h2>Date #17 this year.</h2>
            <p>Same script. Different restaurant.</p>
            <p>"So... you don't eat meat?"</p>
            <p>The questions that follow. The jokes. The defensiveness.</p>
            <p>By dessert, you're exhausted from defending your lifestyle.</p>
            <p className="highlight">What if dating didn't have to start with an explanation?</p>
          </div>
        </div>
      </section>

      <section className="solution">
        <div className="container">
          <div className="solution-content fade-up">
            <h2>Planted is different.</h2>
            <p>We're not another dating app with a "dietary preference" filter.</p>
            <p>We're a curated community of conscious singles who've already chosen compassion.</p>
            <div className="features">
              <div className="feature">
                <h3>🌱 100% Plant-Based</h3>
                <p>Every member is vegan or vegetarian. No exceptions.</p>
              </div>
              <div className="feature">
                <h3>✨ Curated Community</h3>
                <p>Hand-selected founding members who share your values.</p>
              </div>
              <div className="feature">
                <h3>🎥 Real People Only</h3>
                <p>Video verification ensures authentic connections.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="members">
        <div className="container">
          <div className="members-content fade-up">
            <h2>Our Founding Members</h2>
            <div className="stats">
              <div className="stat">
                <div className="number" data-count="73">0</div>
                <p>Singles who get it</p>
              </div>
              <div className="stat">
                <div className="number" data-count="27">0</div>
                <p>Spots remaining</p>
              </div>
              <div className="stat">
                <div className="number" data-count="100">0</div>
                <p>% plant-based</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <div className="testimonials-content fade-up">
            <h2>Real Stories</h2>
            <div className="testimonial">
              <p>"Finally, I can talk about my favorite vegan restaurants without getting 'the look'"</p>
              <cite>— Sarah, 29, Austin</cite>
            </div>
            <div className="testimonial">
              <p>"Met someone who was excited to try my cashew cheese recipe. We're engaged now."</p>
              <cite>— Marcus, 34, Portland</cite>
            </div>
            <div className="testimonial">
              <p>"No more first date anxiety about finding a restaurant we can both enjoy."</p>
              <cite>— Priya, 27, NYC</cite>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <div className="cta-content fade-up">
            <h2>Ready to stop explaining yourself?</h2>
            <p>Join our founding 100 members. Applications close soon.</p>
            <Link to="/register" className="btn-primary">
              Apply Now
            </Link>
            <p className="note">$1 application fee. $19/month after launch for founding members.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;