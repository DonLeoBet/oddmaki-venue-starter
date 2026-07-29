export default function InfoPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 text-gray-200 font-sans leading-relaxed">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 mb-6">
        Welcome to Poly.Football, Lads!
      </h1>
      
      <p className="text-lg mb-6">
        Look, we&apos;re football lads through and through. For years, we sat on the 
        terraces, screaming our lungs out, and later trying to back our shouts on 
        traditional betting exchanges. But let&apos;s be honest—those corporate 
        bookies always miss the proper bets. The liquidity is dead, the odds are 
        rigged in their favor, and the markets we actually wanted to trade just 
        didn&apos;t exist.
      </p>

      <p className="text-lg mb-8">
        We got sick of it. So, we built **Poly.Football**—a pure, no-nonsense 
        prediction market made by football fans, for football fans. No corporate 
        middlemen, no hidden fees, just raw peer-to-peer trading on the 
        beautiful game.
      </p>

      <h2 className="text-2xl font-bold text-cyan-400 mb-4">
        Is it legit? Where&apos;s my money?
      </h2>
      <p className="mb-6">
        Here is the best part: **We never touch your money.** Poly.Football runs 
        entirely on the Base blockchain using the decentralized OddMaki 
        protocol. When you lock in a trade, your funds stay securely inside 
        audit-proof smart contracts on-chain, or rest safely right in your own 
        wallet. No corporate boss can block your account or run away with your 
        bankroll. It&apos;s 100% transparent and completely fair. 
      </p>

      <h2 className="text-2xl font-bold text-pink-500 mb-4">
        How do I get funds on here?
      </h2>
      <p className="mb-6">
        You don&apos;t need to be a crypto wizard to play here. Thanks to our 
        **Privy integration**, you can log in instantly with your Email, Apple, or 
        Google account. Once inside, you can use the **Top-Up** button to buy 
        crypto directly via your mobile banking app or credit card. No 
        complicated wallet setup required. 
      </p>

      <div className="border-l-4 border-cyan-500 bg-gray-900 p-4 rounded mt-8">
        <p className="italic text-sm text-gray-400">
          &quot;Back your knowledge. Trade the match. Own the terraces.&quot; — The Poly.Football Crew
        </p>
      </div>
    </div>
  );
}
