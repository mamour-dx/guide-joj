// Remonté à chaque navigation : la page entre en fondu léger (désactivé si mouvement réduit).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
