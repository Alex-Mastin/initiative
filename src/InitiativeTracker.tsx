"use client"

import { useState, useEffect } from "react"
import { Sword, Shield, Skull, Crown, Plus, Trash2, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {cn} from "@/lib/utils.ts";

type Combatant = {
  id: string
  name: string
  initiative: number
  hp: number
  maxHp: number
  type: "player" | "enemy" | "npc"
  status: string[]
}

// Helper function to safely interact with localStorage
const storage = {
  save: (key: string, value: unknown) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  },
  load: (key: string, defaultValue: unknown) => {
    try {
      if (typeof window !== "undefined") {
        const value = localStorage.getItem(key)
        return value ? JSON.parse(value) : defaultValue
      }
      return defaultValue
    } catch (error) {
      console.error("Error loading from localStorage:", error)
      return defaultValue
    }
  },
}

export default function InitiativeTracker() {
  // Load initial state from localStorage or use defaults
  const [combatants, setCombatants] = useState<Combatant[]>(() => storage.load("dnd-combatants", []))
  const [currentTurn, setCurrentTurn] = useState<number>(() => storage.load("dnd-current-turn", 0))
  const [round, setRound] = useState<number>(() => storage.load("dnd-round", 1))
  const [isCombatActive, setIsCombatActive] = useState<boolean>(() => storage.load("dnd-combat-active", false))

  const [newCombatant, setNewCombatant] = useState<Omit<Combatant, "id">>({
    name: "",
    initiative: 0,
    hp: 0,
    maxHp: 0,
    type: "enemy",
    status: [],
  })
  const [statusEffect, setStatusEffect] = useState<string>("")
  const [editingHealthId, setEditingHealthId] = useState<string | null>(null)
  const [editHealthValue, setEditHealthValue] = useState<string>("")

  // Form input values that can be empty during typing
  const [initiativeInput, setInitiativeInput] = useState<string>("0")
  const [hpInput, setHpInput] = useState<string>("0")
  const [maxHpInput, setMaxHpInput] = useState<string>("0")

  // Initialize form input values
  useEffect(() => {
    setInitiativeInput(newCombatant.initiative.toString())
    setHpInput(newCombatant.hp.toString())
    setMaxHpInput(newCombatant.maxHp.toString())
  }, [])

  // Save to localStorage whenever relevant state changes
  useEffect(() => {
    storage.save("dnd-combatants", combatants)
  }, [combatants])

  useEffect(() => {
    storage.save("dnd-current-turn", currentTurn)
  }, [currentTurn])

  useEffect(() => {
    storage.save("dnd-round", round)
  }, [round])

  useEffect(() => {
    storage.save("dnd-combat-active", isCombatActive)
  }, [isCombatActive])

  const addCombatant = () => {
    if (newCombatant.name.trim() === "") {
      alert("Please enter a combatant name")
      return
    }

    setCombatants([
      ...combatants,
      {
        ...newCombatant,
        id: "randomUUID" in crypto ? crypto.randomUUID() : String(performance.now()),
      },
    ])

    setNewCombatant({
      name: "",
      initiative: 0,
      hp: 0,
      maxHp: 0,
      type: "enemy",
      status: [],
    })

    // Reset form input values
    setInitiativeInput("0")
    setHpInput("0")
    setMaxHpInput("0")
  }

  const removeCombatant = (id: string) => {
    setCombatants(combatants.filter((c) => c.id !== id))
  }

  const sortByInitiative = () => {
    setCombatants([...combatants].sort((a, b) => b.initiative - a.initiative))
    setCurrentTurn(0)
  }

  const startCombat = () => {
    sortByInitiative()
    setIsCombatActive(true)
    setRound(1)
  }

  const endCombat = () => {
    setIsCombatActive(false)
    setCurrentTurn(0)
    setRound(1)
  }

  const nextTurn = () => {
    if (combatants.length === 0) return

    let nextTurn = currentTurn + 1
    if (nextTurn >= combatants.length) {
      nextTurn = 0
      setRound(round + 1)
    }

    setCurrentTurn(nextTurn)
  }

  const updateHP = (id: string, newHP: number) => {
    setCombatants(combatants.map((c) => (c.id === id ? { ...c, hp: newHP } : c)))
  }

  const addStatus = (id: string) => {
    if (!statusEffect.trim()) return

    setCombatants(
      combatants.map((c) =>
        c.id === id
          ? {
            ...c,
            status: c.status.includes(statusEffect) ? c.status : [...c.status, statusEffect],
          }
          : c,
      ),
    )
    setStatusEffect("")
  }

  const removeStatus = (id: string, status: string) => {
    setCombatants(
      combatants.map((c) =>
        c.id === id
          ? {
            ...c,
            status: c.status.filter((s) => s !== status),
          }
          : c,
      ),
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "player":
        return <Crown className="h-4 w-4 text-amber-500" />
      case "enemy":
        return <Skull className="h-4 w-4 text-red-500" />
      case "npc":
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  // Clear all data from localStorage
  const clearSavedData = () => {
    if (confirm("Are you sure you want to clear all saved data? This cannot be undone.")) {
      try {
        localStorage.removeItem("dnd-combatants")
        localStorage.removeItem("dnd-current-turn")
        localStorage.removeItem("dnd-round")
        localStorage.removeItem("dnd-combat-active")
        setCombatants([])
        setCurrentTurn(0)
        setRound(1)
        setIsCombatActive(false)
      } catch (error) {
        console.error("Error clearing localStorage:", error)
      }
    }
  }

  // Handle initiative input blur
  const handleInitiativeBlur = () => {
    const value = initiativeInput === "" ? 0 : Number.parseInt(initiativeInput)
    const validValue = isNaN(value) ? 0 : value
    setInitiativeInput(validValue.toString())
    setNewCombatant({ ...newCombatant, initiative: validValue })
  }

  // Handle HP input blur
  const handleHpBlur = () => {
    const value = hpInput === "" ? 0 : Number.parseInt(hpInput)
    const validValue = isNaN(value) ? 0 : value
    setHpInput(validValue.toString())
    setNewCombatant({ ...newCombatant, hp: validValue })
  }

  // Handle Max HP input blur
  const handleMaxHpBlur = () => {
    const value = maxHpInput === "" ? 0 : Number.parseInt(maxHpInput)
    const validValue = isNaN(value) ? 0 : value
    setMaxHpInput(validValue.toString())

    // Update both maxHp and potentially hp if it exceeds the new maxHp
    setNewCombatant({
      ...newCombatant,
      maxHp: validValue,
      hp: newCombatant.hp > validValue ? validValue : newCombatant.hp,
    })

    // Also update the HP input if needed
    if (newCombatant.hp > validValue) {
      setHpInput(validValue.toString())
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[350px_1fr]">
      <Card className="py-4 md:py-6 gap-4 md:gap-6 h-min">
        <CardHeader className="px-4 md:px-6">
          <CardTitle>Add Combatant</CardTitle>
          <CardDescription>Add players, enemies, or NPCs to the initiative order</CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newCombatant.name}
              onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value })}
              placeholder="Goblin Archer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initiative">Initiative</Label>
              <Input
                id="initiative"
                type="number"
                value={initiativeInput}
                onChange={(e) => setInitiativeInput(e.target.value)}
                onBlur={handleInitiativeBlur}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={newCombatant.type}
                onValueChange={(value) =>
                  setNewCombatant({ ...newCombatant, type: value as "player" | "enemy" | "npc" })
                }
              >
                <SelectTrigger className="w-full" id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="enemy">Enemy</SelectItem>
                  <SelectItem value="npc">NPC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hp">Current HP</Label>
              <Input
                id="hp"
                type="number"
                value={hpInput}
                onChange={(e) => setHpInput(e.target.value)}
                onBlur={handleHpBlur}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxHp">Max HP</Label>
              <Input
                id="maxHp"
                type="number"
                value={maxHpInput}
                onChange={(e) => setMaxHpInput(e.target.value)}
                onBlur={handleMaxHpBlur}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-4 md:px-6">
          <Button onClick={addCombatant} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add to Combat
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <Card className="py-4 md:py-6 gap-4 md:gap-6">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-0 pb-2 px-4 md:px-6">
            <div>
              <CardTitle>Combat Tracker</CardTitle>
              <CardDescription>
                {isCombatActive
                  ? `Round ${round}, ${combatants[currentTurn]?.name || "No one"}'s turn`
                  : "Combat not started"}
              </CardDescription>
            </div>
            <div className={cn("flex gap-2", isCombatActive ? 'w-full grid grid-flow-col grid-cols-2 md:w-auto md:flex' : 'w-full md:w-auto')}>
              {isCombatActive ? (
                <>
                  <Button variant="outline" onClick={nextTurn} key="next-turn">
                    Next Turn
                  </Button>
                  <Button variant="destructive" onClick={endCombat} key="end-combat">
                    End Combat
                  </Button>
                </>
              ) : (
                <Button className="w-full md:w-auto:" variant="default" onClick={startCombat} disabled={combatants.length === 0} key="start-combat">
                  <Sword className="mr-2 h-4 w-4" /> Start Combat
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            {combatants.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No combatants added yet. Add some to begin!</div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="flex flex-col gap-2">
                  {combatants.map((combatant, index) => (
                    <Card
                      key={combatant.id}
                      className={cn('m-px py-4 md:py-6 gap-4 md:gap-6', `${currentTurn === index && isCombatActive ? "outline outline-black border-primary" : ""}`)}
                    >
                      <CardContent className="px-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(combatant.type)}
                            <span className="font-bold">{combatant.name}</span>
                            <Badge variant="outline">Initiative: {combatant.initiative}</Badge>
                            {
                              combatant.type === 'player' &&
                              combatant.hp <= 0 ?
                                combatant.hp <= -Math.abs(combatant.maxHp)
                                  ? (
                                    <Badge variant="destructive">
                                      Dead
                                    </Badge>
                                  )
                                  : (
                                    <Badge>
                                      Downed
                                    </Badge>
                                  )
                                : <></>
                            }
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeCombatant(combatant.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <Tabs defaultValue="health">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="health">Health</TabsTrigger>
                            <TabsTrigger value="status">Status Effects</TabsTrigger>
                          </TabsList>
                          <TabsContent value="health" className="space-y-4 pt-2 md:pt-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateHP(combatant.id, combatant.hp - 1)}
                              >
                                -
                              </Button>
                              <div className="flex-1 text-center">
                                {editingHealthId === combatant.id ? (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault()
                                      const newValue = Number.parseInt(editHealthValue)
                                      if (!isNaN(newValue)) {
                                        updateHP(combatant.id, newValue)
                                      }
                                      setEditingHealthId(null)
                                    }}
                                    className="flex items-center justify-center"
                                  >
                                    <Input
                                      type="number"
                                      value={editHealthValue}
                                      onChange={(e) => setEditHealthValue(e.target.value)}
                                      className="w-16 text-center h-8"
                                      autoFocus
                                      onBlur={() => {
                                        const newValue = Number.parseInt(editHealthValue)
                                        if (!isNaN(newValue)) {
                                          updateHP(combatant.id, newValue)
                                        }
                                        setEditingHealthId(null)
                                      }}
                                    />
                                    <span className="text-muted-foreground ml-1">/{combatant.maxHp}</span>
                                  </form>
                                ) : (
                                  <div
                                    className="cursor-pointer hover:bg-muted rounded px-2 py-1"
                                    onClick={() => {
                                      setEditingHealthId(combatant.id)
                                      setEditHealthValue(combatant.hp.toString())
                                    }}
                                  >
                                    <span className="text-lg font-bold">{combatant.hp}</span>
                                    <span className="text-muted-foreground">/{combatant.maxHp}</span>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateHP(combatant.id, combatant.hp + 1)}
                              >
                                +
                              </Button>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full transition-colors duration-500 ease-in-out ${
                                  combatant.hp > combatant.maxHp
                                    ? "bg-sky-500"
                                    : combatant.hp / combatant.maxHp > 0.5
                                      ? "bg-green-500"
                                      : combatant.hp / combatant.maxHp > 0.25
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                }`}
                                style={{ width: `min(${(combatant.hp / combatant.maxHp) * 100}%, 100%)` }}
                              />
                            </div>
                          </TabsContent>
                          <TabsContent value="status" className="pt-4">
                            <div className="flex gap-2 mb-2">
                              <Input
                                placeholder="Add status effect..."
                                value={statusEffect}
                                onChange={(e) => setStatusEffect(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    addStatus(combatant.id)
                                  }
                                }}
                              />
                              <Button onClick={() => addStatus(combatant.id)}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {combatant.status.length === 0 ? (
                                <span className="text-muted-foreground">No status effects</span>
                              ) : (
                                combatant.status.map((status) => (
                                  <Badge key={status} variant="secondary" className="flex items-center gap-1">
                                    {status}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 ml-1 hover:bg-transparent"
                                      onClick={() => removeStatus(combatant.id, status)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={sortByInitiative} disabled={combatants.length === 0}>
              <ArrowUpDown className="mr-2 h-4 w-4" /> Sort by Initiative
            </Button>
            {combatants.length > 0 && (
              <Button variant="outline" onClick={clearSavedData} className="text-red-500 hover:text-red-700">
                Clear Saved Data
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}



