import React from 'react';

const NewsletterSection = () => {
  return (
    <div>
      <h3>Subscribe to our Newsletter</h3>
      <form>
        <input type="email" placeholder="Enter your email" />
        <button type="submit">Subscribe</button>
      </form>
    </div>
  );
};

export default NewsletterSection;