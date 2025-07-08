import { useState, useEffect } from "react";
import Head from "next/head";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Checkbox,
  FormControlLabel,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import DeleteIcon from "@mui/icons-material/Delete";
import { TeamAdd } from "../components/teams/TeamAdd";
import { EmployeeAdd } from "../components/employees/EmployeeAdd";

interface Employee {
  id: string;
  name: string;
  surname: string;
  position: string;
  created_at: string;
  start_date?: string;
  end_date?: string;
  team_id: string;
}

interface Team {
  id: string;
  name: string;
  parent_team_id?: string;
  employees: Employee[];
  subteams?: Team[];
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTeamAdd, setShowTeamAdd] = useState(false);
  const [showEmployeeAdd, setShowEmployeeAdd] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchTeams = async () => {
    try {
      const response = await fetch("http://localhost:8000/teams", {
        headers: {
          "Authorization": "Bearer mysecrettoken123",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      const data = await response.json();
      
      // Build hierarchical structure
      const teamsMap = new Map<string, Team>();
      const rootTeams: Team[] = [];
      
      data.forEach((team: Team) => {
        teamsMap.set(team.id, { ...team, subteams: [], employees: team.employees || [] });
      });
      
      data.forEach((team: Team) => {
        const teamWithSubteams = teamsMap.get(team.id)!;
        if (team.parent_team_id) {
          const parent = teamsMap.get(team.parent_team_id);
          if (parent) {
            parent.subteams!.push(teamWithSubteams);
          }
        } else {
          rootTeams.push(teamWithSubteams);
        }
      });
      
      setTeams(rootTeams);
      setAllTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const isEmployeeInactive = (employee: Employee) => {
    if (!employee.end_date) return false;
    return new Date(employee.end_date) < new Date();
  };

  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      const response = await fetch("http://localhost:8000/employees/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer mysecrettoken123",
        },
        body: JSON.stringify({
          employee_ids: selectedEmployees,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete employees");
      }

      setSelectedEmployees([]);
      setShowDeleteDialog(false);
      await fetchTeams();
    } catch (error) {
      console.error("Error deleting employees:", error);
      // You might want to show an error message to the user
    }
  };

  const renderTeam = (team: Team, level: number = 0) => (
    <Box key={team.id} sx={{ ml: level * 2 }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">{team.name}</Typography>
          <Chip 
            label={`${team.employees?.length || 0} zaměstnanců`} 
            size="small" 
            sx={{ ml: 2 }}
          />
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {team.employees?.map((employee) => (
              <ListItem key={employee.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => handleEmployeeSelection(employee.id)}
                    />
                  }
                  label=""
                />
                <PersonIcon sx={{ mr: 1 }} />
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography
                        sx={{
                          textDecoration: isEmployeeInactive(employee) ? 'line-through' : 'none',
                          color: isEmployeeInactive(employee) ? 'text.disabled' : 'text.primary',
                        }}
                      >
                        {employee.name} {employee.surname}
                      </Typography>
                      {isEmployeeInactive(employee) && (
                        <Chip label="Neaktivní" size="small" color="error" />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2">Pozice: {employee.position}</Typography>
                      {employee.start_date && (
                        <Typography variant="body2">
                          Začátek: {new Date(employee.start_date).toLocaleDateString()}
                        </Typography>
                      )}
                      {employee.end_date && (
                        <Typography variant="body2">
                          Konec: {new Date(employee.end_date).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            )) || []}
          </List>
          
          {team.subteams && team.subteams.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Podtýmy:
              </Typography>
              {team.subteams.map(subteam => renderTeam(subteam, 1))}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  if (loading) {
    return (
      <>
        <Container maxWidth="md">
            <Typography>Načítání...</Typography>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Container maxWidth="md">
            <Alert severity="error">Chyba: {error}</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Týmy - Fullstack Interview</title>
      </Head>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h4">Týmy a zaměstnanci</Typography>
            <Stack direction="row" spacing={2}>
              {selectedEmployees.length > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Smazat vybrané ({selectedEmployees.length})
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowEmployeeAdd(true)}
              >
                Přidat zaměstnance
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setShowTeamAdd(true)}
              >
                Přidat tým
              </Button>
            </Stack>
          </Stack>

          {teams.length === 0 ? (
            <Card>
              <CardContent>
                <Typography>Žádné týmy nebyly nalezeny.</Typography>
              </CardContent>
            </Card>
          ) : (
            <Box>
              {teams.map(team => renderTeam(team))}
            </Box>
          )}
        </Box>
      </Container>

      {/* Team Add Dialog */}
      <Dialog open={showTeamAdd} onClose={() => setShowTeamAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Přidat nový tým</DialogTitle>
        <DialogContent>
          <TeamAdd 
            teams={allTeams.map(t => ({ id: t.id, name: t.name }))} 
            onSuccess={() => {
              setShowTeamAdd(false);
              fetchTeams();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Employee Add Dialog */}
      <Dialog open={showEmployeeAdd} onClose={() => setShowEmployeeAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Přidat nového zaměstnance</DialogTitle>
        <DialogContent>
          <EmployeeAdd 
            teams={allTeams.map(t => ({ id: t.id, name: t.name }))} 
            onSuccess={() => {
              setShowEmployeeAdd(false);
              fetchTeams();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Potvrzení smazání</DialogTitle>
        <DialogContent>
          <Typography>
            Opravdu chcete smazat {selectedEmployees.length} vybraných zaměstnanců?
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button onClick={() => setShowDeleteDialog(false)}>Zrušit</Button>
            <Button variant="contained" color="error" onClick={handleBulkDelete}>
              Smazat
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
