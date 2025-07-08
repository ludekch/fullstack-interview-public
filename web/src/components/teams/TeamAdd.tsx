import { Controller, useForm } from "react-hook-form";
import AddIcon from "@mui/icons-material/Add";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FormFieldError } from "../forms/FormFieldError";
import { FormSuccess } from "../forms/FormSuccess";
import { FormError } from "../forms/FormError";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  parentTeam: yup.string(),
});

interface TeamAddProps {
  teams?: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

export const TeamAdd = ({ teams = [], onSuccess }: TeamAddProps) => {
  const [formError, setFormError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({ 
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      parentTeam: "",
    }
  });

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setFormError(false);

    try {
      const response = await fetch("http://localhost:8000/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer mysecrettoken123",
        },
        body: JSON.stringify({
          name: formData.name,
          parent_team_id: formData.parentTeam || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create team");
      }

      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 2000);
      onSuccess?.();
    } catch (error) {
      setFormError(true);
    } finally {
      setLoading(false);
    }
  });

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Add Team
      </Typography>
      <form onSubmit={onSubmit}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField fullWidth {...field} label="Name" />
          )}
        />

        {errors.name && <FormFieldError text={errors.name.message} />}

        <FormControl fullWidth sx={{ mt: 3 }}>
          <InputLabel>Parent team</InputLabel>
          <Controller
            name="parentTeam"
            control={control}
            render={({ field }) => (
              <Select {...field} label="Parent team">
                <MenuItem value="">Žádný nadřazený tým</MenuItem>
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </FormControl>

        {errors.parentTeam && (
          <FormFieldError text={errors.parentTeam.message} />
        )}

        <Button type="submit" variant="contained" sx={{ my: 3 }} disabled={loading}>
          {loading ? "Přidávám..." : "Přidat tým"}
        </Button>
        {formError && <FormError text="Please fill out the form correctly" />}
        {success && <FormSuccess text="Team Added" />}
      </form>
    </Box>
  );
};
