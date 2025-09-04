import * as React from "react";

export function Table({ children }: React.PropsWithChildren) { return <table className="w-full text-sm">{children}</table>; }
export function THead({ children }: React.PropsWithChildren) { return <thead className="text-neutral-600">{children}</thead>; }
export function TBody({ children }: React.PropsWithChildren) { return <tbody className="[&>tr]:border-t [&>tr]:border-neutral-100">{children}</tbody>; }
export function TR({ children }: React.PropsWithChildren) { return <tr className="h-10">{children}</tr>; }
export function TH({ children, className }: React.PropsWithChildren<{ className?: string }>) { return <th className={"text-left font-semibold py-2 " + (className ?? "")}>{children}</th>; }
export function TD({ children, className }: React.PropsWithChildren<{ className?: string }>) { return <td className={"py-2 " + (className ?? "")}>{children}</td>; }
